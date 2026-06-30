import './styles/codeBlockExtended.css';

const ENHANCED_ATTR = 'data-gpcb-enhanced';
const NO_COPY_ATTR = 'data-no-copy';
const COPY_BTN_ATTR = 'data-gpcb-copy-btn';
const COPY_BTN_DIFF_ATTR = 'data-gpcb-copy-diff';
const COPY_CLASS_OK = 'gpcb-copy-ok';
const COPY_CLASS_OK_RAW = 'gpcb-copy-ok-raw';
const COPY_CLASS_FAIL = 'gpcb-copy-fail';
const COPY_FEEDBACK_MS = 2000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const NO_FILENAME_ATTR = 'data-no-filename';
const FILENAME_ATTR = 'data-gpcb-filename';
const FILENAME_CLASS = 'gpcb-filename';
const GROWI_FILENAME_SELECTOR = 'cite.code-highlighted-title';

const NO_LANG_ATTR = 'data-no-lang';
const LANG_ICON_CLASS = 'gpcb-lang-icon';
const LANG_DISPLAY_MAP: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python',     python: 'Python',
  sh: 'Bash',       bash: 'Bash', shell: 'Bash',
  html: 'HTML', css: 'CSS', json: 'JSON',
  yml: 'YAML', yaml: 'YAML',
  md: 'Markdown', markdown: 'Markdown',
  diff: 'Diff', sql: 'SQL',
  go: 'Go',
  rs: 'Rust', rust: 'Rust',
  c: 'C', cpp: 'C++',
  java: 'Java',
  rb: 'Ruby', ruby: 'Ruby',
  php: 'PHP',
};
const LANG_ICON_MAP: Record<string, { color: string; abbr: string }> = {
  js:         { color: '#f0b800', abbr: 'JS' },
  javascript: { color: '#f0b800', abbr: 'JS' },
  ts:         { color: '#3178c6', abbr: 'TS' },
  typescript: { color: '#3178c6', abbr: 'TS' },
  py:         { color: '#3572a5', abbr: 'PY' },
  python:     { color: '#3572a5', abbr: 'PY' },
  sh:         { color: '#4eaa25', abbr: 'SH' },
  bash:       { color: '#4eaa25', abbr: 'SH' },
  shell:      { color: '#4eaa25', abbr: 'SH' },
  html:       { color: '#e34f26', abbr: 'HT' },
  css:        { color: '#264de4', abbr: 'CS' },
  json:       { color: '#5a9e47', abbr: '{}' },
  yml:        { color: '#cb171e', abbr: 'YM' },
  yaml:       { color: '#cb171e', abbr: 'YM' },
  md:         { color: '#655e9d', abbr: 'MD' },
  markdown:   { color: '#655e9d', abbr: 'MD' },
  diff:       { color: '#838383', abbr: '±'  },
  sql:        { color: '#e38c00', abbr: 'SQ' },
  go:         { color: '#00acd7', abbr: 'GO' },
  rs:         { color: '#ce4a00', abbr: 'RS' },
  rust:       { color: '#ce4a00', abbr: 'RS' },
  c:          { color: '#005a8c', abbr: 'C'  },
  cpp:        { color: '#00599c', abbr: 'C+' },
  java:       { color: '#b07219', abbr: 'JV' },
  rb:         { color: '#cc342d', abbr: 'RB' },
  ruby:       { color: '#cc342d', abbr: 'RB' },
  php:        { color: '#787cb4', abbr: 'PH' },
};

const NO_LINENUM_ATTR = 'data-no-linenum';
const LINENUMS_CLASS = 'gpcb-linenums';
const LINENUM_HL_CLASS = 'gpcb-linenum-hl';
const CODE_WRAP_CLASS = 'gpcb-code-wrap';
const HL_OVERLAY_CLASS = 'gpcb-hl-overlay';
const HL_LINE_CLASS = 'gpcb-hl-line';
const HL_LINE_HL_CLASS = 'gpcb-hl-line-hl';
const SPEC_RE = /\{([^}]+)\}/;

const NO_DIFF_ATTR = 'data-no-diff';
const DIFF_GUTTER_CLASS = 'gpcb-diff-gutter';
const DIFF_GUTTER_ADD_CLASS = 'gpcb-diff-add';
const DIFF_GUTTER_RM_CLASS = 'gpcb-diff-rm';
const DIFF_GUTTER_HH_CLASS = 'gpcb-diff-hh';
const DIFF_LINE_ADD_CLASS = 'gpcb-diff-line-add';
const DIFF_LINE_RM_CLASS = 'gpcb-diff-line-rm';
const DIFF_LINE_HH_CLASS = 'gpcb-diff-line-hh';
const DIFF_LINENUM_ADD_CLASS = 'gpcb-diff-linenum-add';
const DIFF_LINENUM_RM_CLASS = 'gpcb-diff-linenum-rm';
const DIFF_LINENUM_HH_CLASS = 'gpcb-diff-linenum-hh';

// GROWI のナビバー要素を検索するセレクタ候補（上から順に試す）
const NAVBAR_SELECTORS = [
  '#grw-contextual-sub-nav',
  '[data-testid="grw-contextual-sub-nav"]',
  '.grw-app-header',
  '.grw-navigation-header',
  'nav.navbar.fixed-top',
  'nav.navbar.sticky-top',
];

type CopyBtnState = 'copy' | 'ok' | 'ok-raw' | 'fail';
type DiffLineType = 'added' | 'removed' | 'hunk' | 'context';

interface LinenumConfig {
  start: number;
  highlights: Set<number>;
}

interface BlockRefs {
  toolbar: HTMLDivElement;
  filenameLabel: HTMLSpanElement | null;
  lineNums: HTMLElement | null;
  diffGutter: HTMLElement | null;
  codeWrap: HTMLDivElement | null;
  hlOverlay: HTMLDivElement | null;
  hlScrollHandler: (() => void) | null;
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

function appendPlusMinusBadge(svg: SVGSVGElement): void {
  svg.appendChild(createSvgEl('circle', {
    cx: '18', cy: '18', r: '5.5',
    stroke: 'currentColor', 'stroke-width': '1.5',
    class: 'gpcb-copy-badge-bg',
  }));
  // ± 記号: 上部に + (水平 + 垂直)、下部に − (水平)
  svg.appendChild(createSvgEl('path', {
    d: 'M16 16 H20 M18 13.5 V18.5 M16 20.5 H20',
    stroke: 'currentColor', 'stroke-width': '1.8',
    'stroke-linecap': 'round',
    fill: 'none',
  }));
}

function makeCopyOkRawIcon(): SVGSVGElement {
  const svg = buildSvg([
    { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
    { tag: 'path', attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } },
  ]);
  appendPlusMinusBadge(svg);
  return svg;
}

function makeFailIcon(): SVGSVGElement {
  return buildSvg([
    { tag: 'path', attrs: { d: 'M18 6 6 18' } },
    { tag: 'path', attrs: { d: 'm6 6 12 12' } },
  ]);
}

function makeLangIcon(lang: string): SVGSVGElement | null {
  const def = LANG_ICON_MAP[lang];
  if (!def) return null;
  const svg = createSvgEl('svg', {
    width: '14', height: '16', viewBox: '0 0 12 14',
    fill: 'none', 'aria-hidden': 'true', class: LANG_ICON_CLASS,
  }) as SVGSVGElement;
  svg.appendChild(createSvgEl('path', {
    d: 'M0.5 0.5 H7.5 L11.5 4.5 V13.5 H0.5 Z',
    fill: def.color, opacity: '0.9',
  }));
  svg.appendChild(createSvgEl('path', {
    d: 'M7.5 0.5 V4.5 H11.5 Z',
    fill: 'rgba(255,255,255,0.35)',
  }));
  const textEl = createSvgEl('text', {
    x: '6', y: '11',
    'text-anchor': 'middle',
    'font-size': '4.8',
    fill: 'white', 'font-weight': '700',
    'font-family': 'monospace, ui-monospace',
  });
  textEl.textContent = def.abbr;
  svg.appendChild(textEl);
  return svg;
}

const COPY_BTN_STATE_MAP: Record<CopyBtnState, { icon: () => SVGSVGElement; label: string; className: string | null }> = {
  'copy': {
    icon: makeCopyIcon,
    label: 'Copy to Clipboard',
    className: null,
  },
  'ok': {
    icon: makeCopyOkIcon,
    label: 'Copied!',
    className: COPY_CLASS_OK,
  },
  'ok-raw': {
    icon: makeCopyOkRawIcon,
    label: 'Copied RAW Diff!',
    className: COPY_CLASS_OK_RAW,
  },
  'fail': {
    icon: makeFailIcon,
    label: 'Failed to Copy',
    className: COPY_CLASS_FAIL,
  },
};

function setCopyBtnState(btn: HTMLButtonElement, state: CopyBtnState): void {
  while (btn.firstChild) btn.removeChild(btn.firstChild);
  btn.classList.remove(COPY_CLASS_OK, COPY_CLASS_OK_RAW, COPY_CLASS_FAIL);
  const cfg = COPY_BTN_STATE_MAP[state];
  if (cfg.className) btn.classList.add(cfg.className);
  btn.setAttribute('aria-label', cfg.label);
  btn.setAttribute('data-gpcb-tooltip', cfg.label);
  if (state === 'copy' && btn.hasAttribute(COPY_BTN_DIFF_ATTR)) {
    const diffLabel = 'Copy to Clipboard (Shift+Click: Copy RAW Diff)';
    btn.setAttribute('aria-label', diffLabel);
    btn.setAttribute('data-gpcb-tooltip', diffLabel);
  }
  btn.appendChild(cfg.icon());
}

function flashCopyState(btn: HTMLButtonElement, state: 'ok' | 'ok-raw' | 'fail', pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs?.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
  setCopyBtnState(btn, state);
  const id = window.setTimeout(() => {
    setCopyBtnState(btn, 'copy');
    if (refs) refs.copyTimerId = undefined;
  }, COPY_FEEDBACK_MS);
  if (refs) refs.copyTimerId = id;
}

function handleCopyClick(e: MouseEvent, code: HTMLElement, btn: HTMLButtonElement, pre: HTMLPreElement): void {
  const rawText = code.textContent ?? '';
  const isRaw = e.shiftKey && isDiffTarget(pre, code);
  const text = isRaw ? rawText : (isDiffTarget(pre, code) ? extractNewCode(rawText) : rawText);
  navigator.clipboard.writeText(text).then(
    () => flashCopyState(btn, isRaw ? 'ok-raw' : 'ok', pre),
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

// --- diff helpers ---

function isDiffBlock(code: HTMLElement): boolean {
  return code.classList.contains('language-diff');
}

// {diff} 修飾子（例: ```python{diff}）を検出する
function hasDiffModifier(pre: HTMLPreElement, code: HTMLElement): boolean {
  const spec = findLinenumSpec(pre, code);
  if (!spec) return false;
  return spec.split(',').some(part => part.trim().toLowerCase() === 'diff');
}

function isDiffTarget(pre: HTMLPreElement, code: HTMLElement): boolean {
  return isDiffBlock(code) || hasDiffModifier(pre, code);
}

function classifyDiffLine(line: string): DiffLineType {
  if (line.startsWith('@@')) return 'hunk';
  // +++ / --- はファイルヘッダー行。コード行ではないため hunk と同様に扱い行番号を振らない
  if (line.startsWith('+++') || line.startsWith('---')) return 'hunk';
  if (line.startsWith('+')) return 'added';
  if (line.startsWith('-')) return 'removed';
  return 'context';
}

function extractNewCode(text: string): string {
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  return stripped
    .split('\n')
    .flatMap(line => {
      const type = classifyDiffLine(line);
      if (type === 'hunk' || type === 'removed') return [];
      if (type === 'added') return [line.slice(1)];
      return [line.startsWith(' ') ? line.slice(1) : line];
    })
    .join('\n');
}

function setupDiffView(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_DIFF_ATTR)) return;

  const inner = Array.from(pre.children).find(
    (el): el is HTMLDivElement =>
      el.tagName === 'DIV' && !el.classList.contains('gpcb-toolbar'),
  );
  if (!inner) return;
  if (!inner.contains(code)) return;

  const text = code.textContent ?? '';
  const stripped = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (stripped === '') return;
  const lines = stripped.split('\n');

  // {start=N} を解析して新ファイル側の開始行番号を決定
  const showLineNums = !pre.hasAttribute(NO_LINENUM_ATTR);
  let afterLineNum = 1;
  if (showLineNums) {
    const specStr = findLinenumSpec(pre, code);
    if (specStr) afterLineNum = parseLinenumSpec(specStr).start;
  }

  const linenumsAside = showLineNums ? document.createElement('aside') : null;
  if (linenumsAside) {
    linenumsAside.className = LINENUMS_CLASS;
    linenumsAside.setAttribute('aria-hidden', 'true');
  }

  const diffGutter = document.createElement('aside');
  diffGutter.className = DIFF_GUTTER_CLASS;
  diffGutter.setAttribute('aria-hidden', 'true');

  const hlOverlay = document.createElement('div');
  hlOverlay.className = `${HL_OVERLAY_CLASS} gpcb-diff-overlay`;
  hlOverlay.setAttribute('aria-hidden', 'true');

  for (const line of lines) {
    const type = classifyDiffLine(line);

    // 行番号列: context / added のみカウントアップ、removed / hunk は空白
    if (linenumsAside) {
      const numSpan = document.createElement('span');
      numSpan.textContent = (type === 'context' || type === 'added') ? String(afterLineNum) : ' ';
      if (type === 'added') numSpan.classList.add(DIFF_LINENUM_ADD_CLASS);
      else if (type === 'removed') numSpan.classList.add(DIFF_LINENUM_RM_CLASS);
      else if (type === 'hunk') numSpan.classList.add(DIFF_LINENUM_HH_CLASS);
      linenumsAside.appendChild(numSpan);
    }
    if (type === 'context' || type === 'added') afterLineNum++;

    // diff ガター列
    const span = document.createElement('span');
    if (type === 'added') {
      span.textContent = '+';
      span.classList.add(DIFF_GUTTER_ADD_CLASS);
    } else if (type === 'removed') {
      span.textContent = '\u2212'; // minus sign
      span.classList.add(DIFF_GUTTER_RM_CLASS);
    } else if (type === 'hunk') {
      span.textContent = '@';
      span.classList.add(DIFF_GUTTER_HH_CLASS);
    } else {
      span.textContent = ' ';
    }
    diffGutter.appendChild(span);

    // 背景オーバーレイ行
    const row = document.createElement('div');
    row.className = HL_LINE_CLASS;
    if (type === 'added') row.classList.add(DIFF_LINE_ADD_CLASS);
    else if (type === 'removed') row.classList.add(DIFF_LINE_RM_CLASS);
    else if (type === 'hunk') row.classList.add(DIFF_LINE_HH_CLASS);
    hlOverlay.appendChild(row);
  }

  const codeWrap = document.createElement('div');
  codeWrap.className = CODE_WRAP_CLASS;
  code.parentNode!.insertBefore(codeWrap, code);
  codeWrap.appendChild(code);
  codeWrap.prepend(hlOverlay);

  // DOM 順: [linenum] [diff-gutter] [code-wrap]
  // prepend は先頭挿入なので逆順で呼ぶ
  inner.prepend(diffGutter);
  if (linenumsAside) inner.prepend(linenumsAside);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.lineNums = linenumsAside;
    refs.diffGutter = diffGutter;
    refs.codeWrap = codeWrap;
    refs.hlOverlay = hlOverlay;
    const onScroll = () => {
      hlOverlay.style.transform = `translateX(${codeWrap.scrollLeft}px)`;
    };
    codeWrap.addEventListener('scroll', onScroll, { passive: true });
    refs.hlScrollHandler = onScroll;
  }
}

// --- setup / enhance / cleanup ---

function extractLanguage(code: HTMLElement): string | null {
  for (const cls of code.classList) {
    if (cls.startsWith('language-')) {
      const lang = cls.slice('language-'.length).replace(/\{[^}]*\}/, '').trim().toLowerCase();
      if (lang) return lang;
    }
  }
  return null;
}

function setupFilenameLabel(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.hasAttribute(NO_FILENAME_ATTR)) return;

  const cite = pre.querySelector<HTMLElement>(GROWI_FILENAME_SELECTOR);
  const filename = cite?.textContent?.trim().replace(/\s*\{[^}]*\}\s*$/, '').trim() || null;
  const lang = pre.hasAttribute(NO_LANG_ATTR) ? null : extractLanguage(code);

  if (!filename && !lang) return;

  const label = document.createElement('span');
  label.className = FILENAME_CLASS;
  if (filename) label.setAttribute(FILENAME_ATTR, filename);

  if (lang) {
    const icon = makeLangIcon(lang);
    if (icon) label.appendChild(icon);
  }

  label.appendChild(document.createTextNode(filename ?? (LANG_DISPLAY_MAP[lang!] ?? lang!)));
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
  }

  inner.prepend(aside);

  const refs = blockRefs.get(pre);
  if (refs) {
    refs.lineNums = aside;
    refs.codeWrap = codeWrap;
    refs.hlOverlay = hlOverlay;
    if (hlOverlay) {
      const onScroll = () => {
        hlOverlay!.style.transform = `translateX(${codeWrap.scrollLeft}px)`;
      };
      codeWrap.addEventListener('scroll', onScroll, { passive: true });
      refs.hlScrollHandler = onScroll;
    }
  }
}

function setupCopyButton(toolbar: HTMLDivElement, code: HTMLElement, pre: HTMLPreElement): void {
  if (pre.hasAttribute(NO_COPY_ATTR)) return;
  if (typeof navigator.clipboard?.writeText !== 'function') return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(COPY_BTN_ATTR, '1');
  if (isDiffTarget(pre, code)) btn.setAttribute(COPY_BTN_DIFF_ATTR, '1');
  setCopyBtnState(btn, 'copy');

  const copyHandler = (e: MouseEvent) => {
    e.preventDefault();
    handleCopyClick(e, code, btn, pre);
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

  blockRefs.set(pre, { toolbar, filenameLabel: null, lineNums: null, diffGutter: null, codeWrap: null, hlOverlay: null, hlScrollHandler: null, copyBtn: null, copyHandler: null });

  setupCopyButton(toolbar, code, pre);

  pre.classList.add('gpcb-enhanced');
  pre.prepend(toolbar);
  setupFilenameLabel(pre, code);
  if (isDiffTarget(pre, code)) {
    setupDiffView(pre, code);
  } else {
    setupLineNumbers(pre, code);
  }
  pre.setAttribute(ENHANCED_ATTR, '1');
}

function cleanupBlock(pre: HTMLPreElement): void {
  const refs = blockRefs.get(pre);
  if (refs) {
    if (refs.copyTimerId !== undefined) window.clearTimeout(refs.copyTimerId);
    if (refs.copyBtn && refs.copyHandler) {
      refs.copyBtn.removeEventListener('click', refs.copyHandler);
    }
    if (refs.hlScrollHandler && refs.codeWrap) {
      refs.codeWrap.removeEventListener('scroll', refs.hlScrollHandler);
    }
    if (refs.codeWrap?.isConnected) {
      while (refs.codeWrap.firstChild) {
        refs.codeWrap.parentNode!.insertBefore(refs.codeWrap.firstChild, refs.codeWrap);
      }
      refs.codeWrap.remove();
    }
    refs.lineNums?.remove();
    refs.diffGutter?.remove();
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
            // プラグイン自身が追加した toolbar / filename label / linenums / diff-gutter は無視して無限ループを防ぐ
            if (
              el.classList?.contains('gpcb-toolbar') ||
              el.classList?.contains(FILENAME_CLASS) ||
              el.classList?.contains(LINENUMS_CLASS) ||
              el.classList?.contains(DIFF_GUTTER_CLASS) ||
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
                  const code = parentPre.querySelector<HTMLElement>('code');
                  if (code) setupFilenameLabel(parentPre, code);
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
              // lineNums（通常）または diffGutter（diff）のどちらかが切り離されていれば再セットアップ
              const activeGutter = refs?.lineNums ?? refs?.diffGutter;
              if (refs && (!activeGutter || !activeGutter.isConnected)) {
                if (refs.hlScrollHandler && refs.codeWrap) {
                  refs.codeWrap.removeEventListener('scroll', refs.hlScrollHandler);
                }
                refs.lineNums = null;
                refs.diffGutter = null;
                refs.codeWrap = null;
                refs.hlOverlay = null;
                refs.hlScrollHandler = null;
                const code = parentPre.querySelector<HTMLElement>('code');
                if (code) {
                  if (isDiffTarget(parentPre, code)) setupDiffView(parentPre, code);
                  else setupLineNumbers(parentPre, code);
                }
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
