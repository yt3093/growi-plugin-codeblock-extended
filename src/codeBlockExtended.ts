import './styles/codeBlockExtended.css';

const ENHANCED_ATTR = 'data-gpcb-enhanced';
const NO_COPY_ATTR = 'data-no-copy';
const COPY_BTN_ATTR = 'data-gpcb-copy-btn';
const COPY_CLASS_OK = 'gpcb-copy-ok';
const COPY_CLASS_FAIL = 'gpcb-copy-fail';
const COPY_FEEDBACK_MS = 2000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const NO_FILENAME_ATTR = 'data-no-filename';
const FILENAME_ATTR = 'data-gpcb-filename';
const FILENAME_CLASS = 'gpcb-filename';
const GROWI_FILENAME_SELECTOR = 'cite.code-highlighted-title';

const NO_LINENUM_ATTR = 'data-no-linenum';
const LINENUMS_CLASS = 'gpcb-linenums';
const LINENUM_HL_CLASS = 'gpcb-linenum-hl';
const CODE_WRAP_CLASS = 'gpcb-code-wrap';
const HL_OVERLAY_CLASS = 'gpcb-hl-overlay';
const HL_LINE_CLASS = 'gpcb-hl-line';
const HL_LINE_HL_CLASS = 'gpcb-hl-line-hl';
const SPEC_RE = /\{([^}]+)\}/;

// GROWI のナビバー要素を検索するセレクタ候補（上から順に試す）
const NAVBAR_SELECTORS = [
  '#grw-contextual-sub-nav',
  '[data-testid="grw-contextual-sub-nav"]',
  '.grw-app-header',
  '.grw-navigation-header',
  'nav.navbar.fixed-top',
  'nav.navbar.sticky-top',
];

type CopyBtnState = 'copy' | 'ok' | 'fail';

interface LinenumConfig {
  start: number;
  highlights: Set<number>;
}

interface BlockRefs {
  toolbar: HTMLDivElement;
  filenameLabel: HTMLSpanElement | null;
  lineNums: HTMLElement | null;
  codeWrap: HTMLDivElement | null;
  hlOverlay: HTMLDivElement | null;
  copyBtn: HTMLButtonElement | null;
  copyHandler: ((e: MouseEvent) => void) | null;
  copyTimerId?: number;
}

const blockRefs = new WeakMap<HTMLPreElement, BlockRefs>();

function findNavbarEl(): HTMLElement | null {
  for (const selector of NAVBAR_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.offsetHeight > 0) return el;
  }
  return null;
}

function isHiddenContext(): boolean {
  const path = location.pathname;
  if (path === '/admin' || path.startsWith('/admin/')) return true;
  if (
    location.hash === '#edit' ||
    path.endsWith('/edit') ||
    document.body.classList.contains('editing') ||
    document.body.classList.contains('grw-editor-mode') ||
    document.body.classList.contains('modal-open')
  ) return true;
  return false;
}

function isInEditorDOM(pre: HTMLPreElement): boolean {
  return !!pre.closest('.CodeMirror, .cm-editor, [contenteditable="true"]');
}

// --- SVG helpers ---

function createSvgEl(tag: string, attrs: Record<string, string>): Element {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function buildSvg(children: Array<{ tag: string; attrs: Record<string, string> }>): SVGSVGElement {
  const svg = createSvgEl('svg', {
    width: '15', height: '15', viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }) as SVGSVGElement;
  for (const { tag, attrs } of children) svg.appendChild(createSvgEl(tag, attrs));
  return svg;
}

function makeCopyIcon(): SVGSVGElement {
  return buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
}

function appendCheckBadge(svg: SVGSVGElement): void {
  svg.appendChild(createSvgEl('circle', {
    cx: '18', cy: '18', r: '5.5',
    stroke: 'currentColor', 'stroke-width': '1.5',
    class: 'gpcb-copy-badge-bg',
  }));
  svg.appendChild(createSvgEl('path', {
    d: 'M15.5 18.2l1.8 1.8 3.2-3.5',
    stroke: 'currentColor', 'stroke-width': '1.8',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    fill: 'none',
  }));
}

function makeCopyOkIcon(): SVGSVGElement {
  const svg = buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
  appendCheckBadge(svg);
  return svg;
}

function makeFailIcon(): SVGSVGElement {
  return buildSvg([
    { tag: 'path', attrs: { d: 'M18 6 6 18' } },
    { tag: 'path', attrs: { d: 'm6 6 12 12' } },
  ]);
}

const COPY_BTN_STATE_MAP: Record<CopyBtnState, { icon: () => SVGSVGElement; label: string; className: string | null }> = {
  'copy': {
    icon: makeCopyIcon,
    label: 'コードをクリップボードにコピー',
    className: null,
  },
  'ok': {
    icon: makeCopyOkIcon,
    label: 'クリップボードにコピーしました',
    className: COPY_CLASS_OK,
  },
  'fail': {
    icon: makeFailIcon,
    label: 'クリップボードへのコピーに失敗しました',
    className: COPY_CLASS_FAIL,
  },
};

function setCopyBtnState(btn: HTMLButtonElement, state: CopyBtnState): void {
  while (btn.firstChild) btn.removeChild(btn.firstChild);
  btn.classList.remove(COPY_CLASS_OK, COPY_CLASS_FAIL);
  const cfg = COPY_BTN_STATE_MAP[state];
  if (cfg.className) btn.classList.add(cfg.className);
  btn.setAttribute('aria-label', cfg.label);
  btn.title = cfg.label;
  btn.appendChild(cfg.icon());
}

function flashCopyState(btn: HTMLButtonElement, state: 'ok' | 'fail', pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs?.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
  setCopyBtnState(btn, state);
  const id = window.setTimeout(() => {
    setCopyBtnState(btn, 'copy');
    if (refs) refs.copyTimerId = undefined;
  }, COPY_FEEDBACK_MS);
  if (refs) refs.copyTimerId = id;
}

function handleCopyClick(code: HTMLElement, btn: HTMLButtonElement, pre: HTMLPreElement): void {
  const text = code.textContent ?? '';
  navigator.clipboard.writeText(text).then(
    () => flashCopyState(btn, 'ok', pre),
    (err) => {
      console.warn('[gpcb] clipboard write failed:', err);
      flashCopyState(btn, 'fail', pre);
    },
  );
}

// --- linenum spec parser ---

function parseLinenumSpec(inner: string): LinenumConfig {
  const config: LinenumConfig = { start: 1, highlights: new Set() };
  // ルックアヘッドで「次の key= が来るまで」を value として貪欲マッチ。
  // これにより hl=3,5-7 の内部カンマを誤分割しない。
  const re = /(\w+)\s*=\s*([^=]*?)(?=,\s*\w+\s*=|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (key === 'start') {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n >= 1) config.start = n;
    } else if (key === 'hl') {
      for (const part of value.split(',')) {
        const t = part.trim();
        const range = t.match(/^(\d+)-(\d+)$/);
        if (range) {
          const from = parseInt(range[1], 10);
          const to = parseInt(range[2], 10);
          if (!isNaN(from) && !isNaN(to) && from <= to) {
            for (let i = from; i <= to; i++) config.highlights.add(i);
          }
        } else if (/^\d+$/.test(t)) {
          config.highlights.add(parseInt(t, 10));
        }
      }
    }
  }
  return config;
}

function findLinenumSpec(pre: HTMLPreElement, code: HTMLElement): string | null {
  // <code> の className 内を先に確認（filename なしの場合）
  for (const cls of code.classList) {
    if (cls.startsWith('language-')) {
      const match = cls.match(SPEC_RE);
      if (match) return match[1];
    }
  }
  // <cite> テキスト内を確認（filename ありの場合、GROWI が cite に filename+spec を入れる）
  const cite = pre.querySelector<HTMLElement>(GROWI_FILENAME_SELECTOR);
  if (cite) {
    const match = cite.textContent?.match(SPEC_RE);
    if (match) return match[1];
  }
  return null;
}

// --- setup / enhance / cleanup ---

function setupFilenameLabel(pre: HTMLPreElement): void {
  if (pre.hasAttribute(NO_FILENAME_ATTR)) return;
  const cite = pre.querySelector<HTMLElement>(GROWI_FILENAME_SELECTOR);
  if (!cite) return;
  const filename = cite.textContent?.trim().replace(/\s*\{[^}]*\}\s*$/, '').trim();
  if (!filename) return;

  const label = document.createElement('span');
  label.className = FILENAME_CLASS;
  label.setAttribute(FILENAME_ATTR, filename);
  label.textContent = filename;
  pre.prepend(label);

  const refs = blockRefs.get(pre);
  if (refs) refs.filenameLabel = label;
}

function setupLineNumbers(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_LINENUM_ATTR)) return;

  const inner = Array.from(pre.children).find(
    (el): el is HTMLDivElement =>
      el.tagName === 'DIV' && !el.classList.contains('gpcb-toolbar'),
  );
  if (!inner) return;
  if (!inner.contains(code)) return;

  const text = code.textContent ?? '';
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (stripped === '') return;
  const lineCount = stripped.split('\n').length;

  const specStr = findLinenumSpec(pre, code);
  const config: LinenumConfig = specStr
    ? parseLinenumSpec(specStr)
    : { start: 1, highlights: new Set() };

  const aside = document.createElement('aside');
  aside.className = LINENUMS_CLASS;
  aside.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < lineCount; i++) {
    const displayNum = config.start + i;
    const span = document.createElement('span');
    span.textContent = String(displayNum);
    if (config.highlights.has(displayNum)) span.classList.add(LINENUM_HL_CLASS);
    aside.appendChild(span);
  }

  // <code> を横スクロールコンテナで包む（aside を scroll の外に出して左固定を実現）
  const codeWrap = document.createElement('div');
  codeWrap.className = CODE_WRAP_CLASS;
  code.parentNode!.insertBefore(codeWrap, code);
  codeWrap.appendChild(code);

  // ハイライト行があればオーバーレイを挿入（flex 等分割で line-height 計測不要）
  let hlOverlay: HTMLDivElement | null = null;
  if (config.highlights.size > 0) {
    hlOverlay = document.createElement('div');
    hlOverlay.className = HL_OVERLAY_CLASS;
    hlOverlay.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < lineCount; i++) {
      const displayNum = config.start + i;
      const row = document.createElement('div');
      row.className = HL_LINE_CLASS;
      if (config.highlights.has(displayNum)) row.classList.add(HL_LINE_HL_CLASS);
      hlOverlay.appendChild(row);
    }
    codeWrap.prepend(hlOverlay);

    // content 幅が visible 幅を超える場合、overlay を content 幅まで拡張する。
    // position:absolute の right:0 は visible 幅に留まるため、scroll 時に overlay が流れるのを防ぐ。
    requestAnimationFrame(() => {
      if (hlOverlay!.isConnected) {
        // right:0 は visible 幅に固定されるため使わず、width を直接設定して content 全幅をカバーする
        hlOverlay!.style.width = `${code.scrollWidth}px`;
      }
    });
  }

  inner.prepend(aside);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.lineNums = aside;
    refs.codeWrap = codeWrap;
    refs.hlOverlay = hlOverlay;
  }
}

function setupCopyButton(toolbar: HTMLDivElement, code: HTMLElement, pre: HTMLPreElement): void {
  if (pre.hasAttribute(NO_COPY_ATTR)) return;
  if (typeof navigator.clipboard?.writeText !== 'function') return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(COPY_BTN_ATTR, '1');
  setCopyBtnState(btn, 'copy');

  const copyHandler = (e: MouseEvent) => {
    e.preventDefault();
    handleCopyClick(code, btn, pre);
  };
  btn.addEventListener('click', copyHandler);
  toolbar.appendChild(btn);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.copyBtn = btn;
    refs.copyHandler = copyHandler;
  }
}

function isEligible(pre: HTMLPreElement): boolean {
  if (pre.hasAttribute(ENHANCED_ATTR)) return false;
  if (!pre.querySelector('code')) return false;
  if (isInEditorDOM(pre)) return false;
  return true;
}

function enhanceCodeBlock(pre: HTMLPreElement): void {
  const code = pre.querySelector<HTMLElement>('code');
  if (!code) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'gpcb-toolbar';

  blockRefs.set(pre, { toolbar, filenameLabel: null, lineNums: null, codeWrap: null, hlOverlay: null, copyBtn: null, copyHandler: null });

  setupCopyButton(toolbar, code, pre);

  pre.classList.add('gpcb-enhanced');
  pre.prepend(toolbar);
  setupFilenameLabel(pre);
  setupLineNumbers(pre, code);
  pre.setAttribute(ENHANCED_ATTR, '1');
}

function cleanupBlock(pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs) {
    if (refs.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
    if (refs.copyBtn && refs.copyHandler) {
      refs.copyBtn.removeEventListener('click', refs.copyHandler);
    }
    if (refs.codeWrap?.isConnected) {
      while (refs.codeWrap.firstChild) {
        refs.codeWrap.parentNode!.insertBefore(refs.codeWrap.firstChild, refs.codeWrap);
      }
      refs.codeWrap.remove();
    }
    refs.lineNums?.remove();
    refs.filenameLabel?.remove();
    refs.toolbar.remove();
    blockRefs.delete(pre);
  }
  pre.classList.remove('gpcb-enhanced');
  pre.removeAttribute(ENHANCED_ATTR);
}

function scanAndEnhance(): void {
  if (isHiddenContext()) return;
  document.querySelectorAll<HTMLPreElement>('pre').forEach(pre => {
    if (isEligible(pre)) enhanceCodeBlock(pre);
  });
}

export function createCodeBlockExtended(): { mount(): void; unmount(): void } {
  let observer: MutationObserver | null = null;
  let observerRafId: number | null = null;
  let scanRafId: number | null = null;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function scheduleScan(): void {
    if (scanRafId !== null) return;
    scanRafId = requestAnimationFrame(() => {
      scanRafId = null;
      scanAndEnhance();
    });
  }

  function onNavigation(): void {
    requestAnimationFrame(() => {
      scheduleScan();
    });
  }

  function mount(): void {
    history.pushState = function (...args) {
      originalPushState(...args);
      window.dispatchEvent(new Event('growi-pcb-navigate'));
    };
    history.replaceState = function (...args) {
      originalReplaceState(...args);
      window.dispatchEvent(new Event('growi-pcb-navigate'));
    };

    window.addEventListener('popstate', onNavigation);
    window.addEventListener('hashchange', onNavigation);
    window.addEventListener('growi-pcb-navigate', onNavigation);

    observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of Array.from(m.addedNodes)) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;
            // プラグイン自身が追加した toolbar / filename label / linenums は無視して無限ループを防ぐ
            if (
              el.classList?.contains('gpcb-toolbar') ||
              el.classList?.contains(FILENAME_CLASS) ||
              el.classList?.contains(LINENUMS_CLASS) ||
              el.classList?.contains(CODE_WRAP_CLASS) ||
              el.classList?.contains(HL_OVERLAY_CLASS)
            ) continue;

            // GROWI が enhance 済み <pre> に後から <cite class="code-highlighted-title"> を追加するケース
            // （enhance 時点で cite がなく setupFilenameLabel が空振りした場合の救済）
            if (m.target.nodeType === Node.ELEMENT_NODE && el.matches?.(GROWI_FILENAME_SELECTOR)) {
              const parentPre = (m.target as Element).closest<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`);
              if (parentPre) {
                const refs = blockRefs.get(parentPre);
                if (refs && !refs.filenameLabel) {
                  setupFilenameLabel(parentPre);
                }
              }
              continue;
            }

            // Prism が enhance 済み <pre> に後から内側 div を挿入 or 差し替えするケース
            // （enhance 時点で Prism div が未挿入の場合、および Prism がハイライト適用で div を差し替えた場合の救済）
            if (
              m.target.nodeType === Node.ELEMENT_NODE &&
              (m.target as Element).matches?.(`pre[${ENHANCED_ATTR}]`) &&
              el.tagName === 'DIV'
            ) {
              const parentPre = m.target as HTMLPreElement;
              const refs = blockRefs.get(parentPre);
              // isConnected で旧 aside が DOM から切り離されていないか確認する
              if (refs && (!refs.lineNums || !refs.lineNums.isConnected)) {
                refs.lineNums = null;
                refs.codeWrap = null;
                refs.hlOverlay = null;
                const code = parentPre.querySelector<HTMLElement>('code');
                if (code) setupLineNumbers(parentPre, code);
              }
              continue;
            }

            if (
              (el.tagName === 'PRE' && !el.hasAttribute(ENHANCED_ATTR)) ||
              el.querySelector(`pre:not([${ENHANCED_ATTR}])`)
            ) {
              shouldScan = true;
              break;
            }
          }
        } else if (m.type === 'attributes') {
          if (isHiddenContext()) {
            document.querySelectorAll<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`).forEach(cleanupBlock);
          } else {
            shouldScan = true;
          }
        }
        if (shouldScan) break;
      }

      if (!shouldScan) return;
      if (observerRafId !== null) return;
      observerRafId = requestAnimationFrame(() => {
        observerRafId = null;
        scheduleScan();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    scheduleScan();
  }

  function unmount(): void {
    window.removeEventListener('popstate', onNavigation);
    window.removeEventListener('hashchange', onNavigation);
    window.removeEventListener('growi-pcb-navigate', onNavigation);

    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;

    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scanRafId !== null) {
      cancelAnimationFrame(scanRafId);
      scanRafId = null;
    }
    if (observerRafId !== null) {
      cancelAnimationFrame(observerRafId);
      observerRafId = null;
    }

    document.querySelectorAll<HTMLPreElement>(`pre[${ENHANCED_ATTR}]`).forEach(cleanupBlock);
  }

  return { mount, unmount };
}
