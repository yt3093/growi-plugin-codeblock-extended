# CLAUDE.md

## プロジェクト概要

- **名前**: `growi-plugin-codeblock-extended`
- **種別**: GROWI Script プラグイン
- **目的**: GROWI ページ本文中の Markdown コードブロック（`<pre><code>`）にコピーボタン・言語ラベル・行番号・折りたたみ・全画面表示などの機能を追加する

### 実装済み機能

| 機能 | 説明 |
|---|---|
| ファイル名ラベル | `言語:ファイル名` 記法時のみ、コードブロック左上にタブ風で表示。コードブロック本体の下レイヤーに配置し（`padding-bottom` + 負の `margin-bottom` で底部を潜り込ませる）、ラベルテキストは選択可能。GROWI デフォルトの `<cite class="code-highlighted-title">` は CSS で非表示にして置き換える。`data-no-filename` で opt-out |
| 言語アイコン | ファイル名ラベル左端に言語アイコンを表示。`LANG_ICON_MAP` に登録済みの言語は専用カラーアイコン（devicon ベース SVG）、未登録言語は汎用ファイルアイコン（白半透明）。`{lang=xxx}` spec オプションで `extractLanguage` の結果を上書き可能。アイコンは `<svg class="gpcb-lang-icon">` として DOM に挿入。`data-no-lang` で opt-out |
| コピーボタン | コードブロック右上にボタンを**ホバー時のみ表示**（Zenn 風 UI）。通常クリックで `<code>` の `textContent` をコピー。diff ブロックでは通常クリック=新コードのみ（`+`/空白行から先頭記号を除去・削除行/ハンク行を除外）、Shift+クリック=raw diff テキスト |
| 成功/失敗フィードバック | 通常コピー成功: 2 秒間 ✓ バッジ（緑）。diff raw コピー成功: 2 秒間 ± バッジ（青）。失敗: ✕ アイコン（赤）。2 秒後に元に戻る |
| コピーボタン tooltip | ホバー時に `data-gpcb-tooltip` 属性値をカスタム CSS tooltip で表示（0.2s 遅延後 0.1s で表示、マウスが外れると 1.5s でゆっくり消える）。diff ブロックでは "Shift+Click: Copy RAW Diff" のヒントをツールチップに含める |
| `navigator.clipboard` 非対応 | ボタンを非生成（早期 return） |
| opt-out 属性 | `<pre data-no-copy>` でコピーボタンを非表示（ソート等は無関係） |
| 非表示条件 | 編集モード（`/edit`, `#edit`, `body.editing`, `body.grw-editor-mode`, `body.modal-open`）・管理画面（`/admin`）・印刷時はボタン非表示 |
| SPA 遷移 | `pushState` / `replaceState` モンキーパッチ + `popstate` + `hashchange` で再スキャン |
| 動的追加対応 | `MutationObserver` で `<pre>` 追加を検知して自動初期化 |
| エディタ DOM 除外 | `.CodeMirror` / `.cm-editor` / `[contenteditable="true"]` 配下の `<pre>` は対象外 |
| deactivate | 全 listener 解除・MutationObserver.disconnect・モンキーパッチ復元・toolbar 削除・付与した `gpcb-enhanced` クラスと `data-gpcb-enhanced` 属性を全削除。`<code>` の中身は完全無変更 |
| ダークモード | `@media (prefers-color-scheme: dark)` と `html[data-bs-theme="dark"]`（Bootstrap 5.3 GROWI UI トグル）の双方で CSS 変数を上書き |
| reduced-motion | `prefers-reduced-motion: reduce` 環境ではフラッシュアニメなし |
| 行番号 | コードブロック左側に `<aside class="gpcb-linenums">` を並置。Prism 内側 div を `display: flex !important` で flex 化し、`<aside>`（flex-shrink: 0）と `.gpcb-code-outer > .gpcb-code-wrap`（`overflow-x: auto`）を横並び。`<code>` の DOM は不変。`data-no-linenum` で opt-out |
| コードスクロールコンテナ | `<code>` を `<div class="gpcb-code-wrap">` で包んで `overflow-x: auto` をここに限定。さらにその外側を `<div class="gpcb-code-outer">` で包む（overflow fade の重ね合わせのため）。`<aside>` は flex item として外側に置くため横スクロール時に左固定になる（`position: sticky` 不要） |
| 横オーバーフロー可視化 | コード内容が横幅を超える場合、`gpcb-code-outer` の `::before` / `::after` CSS 疑似要素でフェードグラデーションを表示。未スクロール時は右端のみ、途中スクロール時は両端、末尾到達時は左端のみ表示。`getCodeBg()` で `getComputedStyle` を使い `<pre>` 到達まで DOM を遡って背景色を取得し、`--gpcb-overflow-bg` CSS 変数としてグラデーション色に使用。`ResizeObserver` でリサイズ時にも再評価。`isolation: isolate` により疑似要素の `z-index` が `.gpcb-toolbar` を覆わないよう封じ込め。ホバー時はスクロールバーのサム色を明るくして存在を示す。`data-no-overflow-fade` で opt-out |
| 開始行番号指定 | コードフェンスに `{start=N}` を付けると行番号を N から開始。`findLinenumSpec` で `<code>` className または `<cite>` テキストから `{...}` を抽出し、`parseSpec` で解析 |
| 行ハイライト | `{hl=行番号[,範囲...]}` で指定行の背景を強調。コード側は `.gpcb-code-wrap` 内の絶対配置 flex column オーバーレイ（`.gpcb-hl-overlay`）、行番号 aside 側は対応 `<span>` に `.gpcb-linenum-hl` クラスを付与 |
| 差分表示 | `language-diff` ブロックまたは `{diff}` 修飾子付きブロックで diff ガター（`<aside class="gpcb-diff-gutter">`）と背景オーバーレイを生成。追加行=緑・削除行=赤・ハンク行=紫。`language-diff` ブロックは Prism/Shiki のトークン背景色を `background: none !important` でリセット（文字色は残す）。行番号は追加/コンテキスト行にのみ付与（削除行・ハンク行はカウントしない）。`{start=N}` で開始番号指定可能。`data-no-diff` で opt-out |
| ハイライト横スクロール追従 | オーバーレイは `left: 0; right: 0`（visible 幅固定）。`codeWrap` の scroll イベントで `hlOverlay.style.transform = translateX(scrollLeft)` を更新しビューポート追従させる（layout 計測不要） |
| 印刷最適化 | `@media print` で toolbar・行番号（`gpcb-linenums`）・diff ガター・hl-overlay を非表示。コードブロックは白背景・黒文字・`border: 1px solid #ccc` に反転し、`break-inside: avoid` でページをまたがないようにする。Shiki / Prism のインラインスタイルを `!important` で上書き。長い行は `white-space: pre-wrap` + `word-break: break-all` で折り返し。ファイル名ラベルは薄いグレー背景・黒文字で表示 |
| 折りたたみ | `{fold}` / `{fold=N}` で行数が閾値を超えるブロックに fold UI を注入。ラベルバー（`.gpcb-filename`）右端に総行数を表示し、ファイル名なしブロックはラベルバーを新規生成する。折りたたみ状態: Prism 内側 div（`inner`）に `gpcb-fold-collapsed` クラスを付与して `max-height: var(--gpcb-fold-height)` でクリップ。グラデーションオーバーレイ（`.gpcb-fold-overlay`）下端に「▼ Expand」ボタンを表示。展開状態: `inner.style.paddingBottom = '44px'` でコード末尾に余白を確保し「▲ Collapse」ボタンをオーバーレイで表示（コードとボタンが重ならない）。ツールバーのトグルボタン（`[data-gpcb-fold-btn]`）でも Expand/Collapse を切り替え。折りたたみ時は直前の `pre.getBoundingClientRect().top` を記録し、アニメーション完了後に `window.scrollBy({ top: delta, behavior: 'instant' })` でビューポート位置を補正（画面ずれ防止）。`animGen` 世代カウンタで展開/折りたたみの連続クリック競合を防止。印刷時は `gpcb-fold-collapsed` を外して全展開。`data-no-fold` で opt-out |


## アーキテクチャ

このプラグインは Markdown レンダリングの拡張ではなく **DOM 直接操作** を行う。`customGenerateViewOptions` は使わず、`activate()` 内で既存の `<pre>` をスキャンして機能を注入し、`MutationObserver` で動的追加にも追従する。

**ブランチ運用方針**: 機能ごとに git ブランチを分けて実装・確認し、マージする。

### ファイル構成

```
growi-plugin-codeblock-extended/
├── client-entry.tsx                       # activate / deactivate + pluginActivators 登録
├── src/
│   ├── codeBlockExtended.ts              # コア実装（スキャン・コピー・SPA 遷移・クリーンアップ）
│   ├── types.ts                           # 共有型定義（SvgElDef / LangIconDef / CopyBtnState / DiffLineType / ParsedSpec / BlockRefs）
│   └── styles/codeBlockExtended.css      # toolbar スタイル・ボタン・ダークモード・@media print
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                         # build.manifest: 'manifest.json' を明示
├── pnpm-lock.yaml
└── dist/                                  # ビルド成果物（コミット必須）
    ├── manifest.json
    └── assets/
        ├── client-entry-*.js
        └── client-entry-*.css
```

### 主要な実装ポイント

**`createCodeBlockExtended()`** が公開 API で `{ mount, unmount }` を返す。

- **`scanAndEnhance()`**: `document.querySelectorAll('pre')` でページ上の全 `<pre>` をスキャンし、`isEligible(pre)` をパスしたものに `enhanceCodeBlock(pre)` を呼ぶ。`isHiddenContext()` が true の場合は何もしない。

- **`isEligible(pre)`**: 以下をすべて満たすもののみ対象
  - `data-gpcb-enhanced` 属性が未付与
  - `pre.querySelector('code')` が存在する（**直下子ではなく子孫を検索**。GROWI の Prism が `<pre>` と `<code>` の間に `<div>` を挿入するため `:scope > code` は不可）
  - `isInEditorDOM(pre)` が false（`.CodeMirror` / `.cm-editor` / `[contenteditable="true"]` 配下でない）
  - `isHiddenContext()` が false
  - 各機能の opt-out（`data-no-copy` / `data-no-filename` / `data-no-linenum`）は機能ごとの setup 関数内で確認するため、`isEligible` では判定しない

- **`enhanceCodeBlock(pre)`**: コーディネータ
  1. `<div class="gpcb-toolbar">` を生成
  2. `blockRefs.set(pre, createBlockRefs(toolbar))` で WeakMap に登録
  3. `setupCopyButton(toolbar, code, pre)` — `navigator.clipboard.writeText` が利用可能かつ `data-no-copy` がなければボタンを生成
  4. `pre.classList.add('gpcb-enhanced')`、`pre.prepend(toolbar)`
  5. `setupFilenameLabel(pre)` — `data-no-filename` がなく `<cite class="code-highlighted-title">` が存在すれば、その textContent を `<span class="gpcb-filename">` として prepend（DOM 順: [filename, toolbar, 元の中身]）。`data-no-lang` がなければ `makeLangIcon(lang)` で言語アイコンを prepend。`lang` は `findLinenumSpec` + `parseSpec` の `lang` キーを優先し、なければ `extractLanguage(code)` を使用。ラベルバー右端に `<span class="gpcb-linecount">N lines</span>` を追加
  6. `setupLineNumbers(pre, code)` — `data-no-linenum` がなく Prism 内側 div が存在すれば、行数算出・spec 解析・aside 生成・code-wrap 生成・hlOverlay 生成・scroll リスナー登録を行う
  7. `pre.setAttribute('data-gpcb-enhanced', '1')`
  8. `setupFold(pre, code)` — `{fold}` / `{fold=N}` spec があり行数が閾値を超える場合に fold UI を注入。`data-no-fold` 属性があれば早期 return

- **`handleCopyClick(e, code, btn, pre)`**: `e.shiftKey && isDiffTarget(pre, code)` なら raw テキストを、それ以外で diff ブロックなら `extractNewCode(rawText)` を、通常ブロックなら `rawText` をそのまま `navigator.clipboard.writeText` に渡す。成功時は `flashCopyState(btn, isRaw ? 'ok-raw' : 'ok', pre)`、失敗時は `'fail'` を渡す。

- **`extractNewCode(text)`**: diff テキストを行単位で処理し、hunk/removed 行を除外。added 行は先頭 `+` を除去、context 行は先頭スペースを除去して結合する。

- **`flashCopyState(btn, state, pre)`**: `blockRefs` WeakMap から既存タイマーを取り出してクリアし、`setCopyBtnState` でアイコン・クラス・aria-label を更新。2 秒後に元の状態に戻す `setTimeout` id を `blockRefs.copyTimerId` に保持する。

- **`setCopyBtnState(btn, state)`**: ボタンの子要素を全削除してから `COPY_BTN_STATE_MAP` のアイコン生成関数を呼び、結果を `appendChild`。`aria-label` と `data-gpcb-tooltip` を同値で設定する（`title` 属性は使わない）。`state === 'copy'` かつ `data-gpcb-copy-diff` 属性あり（diff ブロック）の場合は tooltip テキストに Shift+Click ヒントを付加する。`innerHTML` は使わない。

- **`setupLineNumbers(pre, code)`**: ① `code.textContent` から行数算出（末尾改行除外）② `findLinenumSpec` → `parseSpec` で `{start=N,hl=...}` を解析 ③ `<aside class="gpcb-linenums">` を行数分の `<span>` で生成（highlight 行は `.gpcb-linenum-hl` クラス）④ `<div class="gpcb-code-outer">` > `<div class="gpcb-code-wrap">` で `<code>` を包む ⑤ highlight 行があれば `<div class="gpcb-hl-overlay">` を `codeWrap.prepend` ⑥ hlOverlay 用 scroll イベントリスナーを codeWrap に登録し `refs.hlScrollHandler` に保持 ⑦ aside を Prism 内側 div に prepend ⑧ `setupOverflowFade(codeOuter, codeWrap, code, pre)` を呼ぶ

- **`findLinenumSpec(pre, code)`**: `<code>` の className を先に確認（`language-xxx{...}` 形式）。なければ `<cite class="code-highlighted-title">` のテキストを確認（ファイル名あり記法では cite に `file.py{...}` が残る）。`SPEC_RE = /\{([^}]+)\}/` でマッチ。

- **`parseSpec(inner)`**: まず `,` で分割して各トークンをトリム・小文字化し、`diff` / `fold` / `fold=N` をフラグとして解析する。次にルックアヘッド正規表現 `/(\w+)\s*=\s*([^=]*?)(?=,\s*\w+\s*=|$)/g` で key=value（`start`・`lang`・`hl`）を抽出。`hl` 値内カンマを誤分割しないよう lookahead で吸収。戻り値は `ParsedSpec`（`start`・`highlights`・`lang?`・`diff`・`fold`・`foldLines`）。

- **`isDiffTarget(pre, code)`**: `code.classList.contains('language-diff')` が true、または `findLinenumSpec` で取得したスペック文字列を `parseSpec` で解析して `diff === true` なら diff ブロックと見なす。diff ブロックと判定された場合は `setupDiffView` のみを呼び `setupLineNumbers` は呼ばない。このため `{hl=...}` や `{start=...}` を同時に指定しても**黙って無視**される（仕様）。

- **`setupDiffView(pre, code)`**: `setupLineNumbers` と同様の構造で、①行テキストを改行分割 ②各行を `classifyDiffLine`（`@@` → hunk、`+++`/`---` → hunk、`+` → added、`-` → removed、他 → context）で分類 ③`data-no-linenum` がなければ `<aside class="gpcb-linenums">` を生成（added/context 行のみ番号を振る、removed/hunk はカウントしない）④`<aside class="gpcb-diff-gutter">` にガター記号 span を生成 ⑤`<div class="gpcb-hl-overlay">` に行分の div を生成（added/removed/hunk に対応クラス付与）⑥`<code>` を `<div class="gpcb-code-outer">` > `<div class="gpcb-code-wrap">` で包む ⑦scroll リスナー登録 ⑧`setupOverflowFade(codeOuter, codeWrap, code, pre)` を呼ぶ。`data-no-diff` 属性があれば早期 return。`{start=N}` で行番号の開始番号を指定可能。

- **`cleanupBlock(pre)`**: `blockRefs.get(pre)` から `copyTimerId`（`clearTimeout`）・`copyHandler`（`removeEventListener`）・`hlScrollHandler`（`codeWrap.removeEventListener`）・`overflowScrollHandler`（`codeWrap.removeEventListener`）を解除。`overflowObserver.disconnect()` で ResizeObserver を破棄。`codeWrap` の子を全て親（`codeOuter`）に移してから `codeWrap.remove()`、続いて `codeOuter` の子を全て親に移してから `codeOuter.remove()`（この 2 段階アンラップで `<code>` が `inner` div に戻る）。`lineNums`・`diffGutter`・`filenameLabel`・`toolbar` を `.remove()`。fold 関連: `foldInner` から `gpcb-fold-collapsed` クラスと fold 系インラインスタイル（`max-height` / `overflow-y` / `position` / `padding-bottom` / CSS 変数）を除去し、`foldOverlay.remove()`・`foldCollapseHandler` を `foldCollapseBtn.removeEventListener` で解除。`gpcb-enhanced` クラスと `data-gpcb-enhanced` 属性を削除。`<code>` の中身は一切変更しない。`<cite class="code-highlighted-title">` は DOM から削除しない（CSS スコープが外れると自動復帰する）。

- **SPA 遷移検知**: `pushState` / `replaceState` にカスタムイベント `'growi-pcb-navigate'` をモンキーパッチ。`popstate` / `hashchange` も購読し、いずれも 2 段 `requestAnimationFrame` で DOM が安定してから `scanAndEnhance()` を実行。

- **MutationObserver**: `document.body` を `childList: true, subtree: true, attributes: true, attributeFilter: ['class']` で監視。追加ノード判定では **`.gpcb-toolbar` / `.gpcb-filename` / `.gpcb-linenums` / `.gpcb-diff-gutter` / `.gpcb-code-outer` / `.gpcb-code-wrap` / `.gpcb-hl-overlay` を持つ要素はスキップ**して自己追加による無限ループを防ぐ。Prism が enhance 済み `<pre>` に内側 div を後から挿入・差し替えした場合（`refs.lineNums.isConnected` が false）は scroll リスナーを解除し `overflowObserver.disconnect()` を呼んでから `refs.lineNums / diffGutter / codeWrap / codeOuter / overflowObserver / overflowScrollHandler / hlOverlay / hlScrollHandler` をリセットし `setupLineNumbers` / `setupDiffView` を再実行（`setupOverflowFade` も再呼び出しされるため背景色も再取得される）。`body.class` 変化時（編集モード遷移）は `isHiddenContext()` を判定し、true なら全 enhanced `<pre>` を即 `cleanupBlock`、false なら `scheduleScan()`。

- **`isHiddenContext()`**: `/admin` / `/admin/*` パス、`#edit` / `/edit` サフィックス、`body.editing` / `body.grw-editor-mode` / `body.modal-open` クラスのいずれかで true を返す。

- **`isInEditorDOM(pre)`**: `pre.closest('.CodeMirror, .cm-editor, [contenteditable="true"]')` が null でなければ true。

- **`findInnerDiv(pre)`**: `pre` の直接子要素から `gpcb-toolbar` クラスを持たない最初の `<div>` を返す。Prism が `<pre>` と `<code>` の間に挿入する内側 `<div>` を特定するために使用。

- **`wrapCodeInScrollContainer(code)`**: `code.parentNode` の直前に `<div class="gpcb-code-outer">` > `<div class="gpcb-code-wrap">` を挿入し、`code` を `codeWrap` 内に移動して `{ codeOuter, codeWrap }` を返す。`setupLineNumbers` と `setupDiffView` で共通して使用。

- **`createBlockRefs(toolbar)`**: `BlockRefs` オブジェクトを初期値（`toolbar` 以外は `null`）で生成して返す。`enhanceCodeBlock` 内で WeakMap への登録に使用し、長い初期化オブジェクトリテラルを一箇所に集約する。

### 命名規約

| 対象 | 値 |
|---|---|
| プレフィックス | `gpcb-*` |
| enhanced マーカー属性 | `data-gpcb-enhanced` |
| カスタムイベント名 | `growi-pcb-navigate` |
| CSS 変数 | `--gpcb-*` |
| opt-out（コピー） | `data-no-copy` |
| opt-out（ファイル名ラベル） | `data-no-filename` |
| opt-out（行番号） | `data-no-linenum` |
| opt-out（差分表示） | `data-no-diff` |
| opt-out（言語アイコン） | `data-no-lang` |
| opt-out（横オーバーフロー可視化） | `data-no-overflow-fade` |
| opt-out（折りたたみ） | `data-no-fold` |
| 言語アイコンクラス | `gpcb-lang-icon` |
| ファイル名ラベル属性 | `data-gpcb-filename` |
| コピーボタン diff マーカー属性 | `data-gpcb-copy-diff` |
| コピーボタン tooltip 属性 | `data-gpcb-tooltip` |
| 行番号 aside クラス | `gpcb-linenums` |
| 行番号ハイライトクラス | `gpcb-linenum-hl` |
| overflow fade ラッパークラス | `gpcb-code-outer` |
| コードスクロールコンテナクラス | `gpcb-code-wrap` |
| overflow fade 左表示クラス | `gpcb-of-left` |
| overflow fade 右表示クラス | `gpcb-of-right` |
| overflow fade 背景色変数 | `--gpcb-overflow-bg` |
| ハイライトオーバーレイクラス | `gpcb-hl-overlay` |
| ハイライト行クラス | `gpcb-hl-line` / `gpcb-hl-line-hl` |
| diff ガタークラス | `gpcb-diff-gutter` |
| diff ガター記号クラス | `gpcb-diff-add` / `gpcb-diff-rm` / `gpcb-diff-hh` |
| diff オーバーレイ行クラス | `gpcb-diff-line-add` / `gpcb-diff-line-rm` / `gpcb-diff-line-hh` |
| コピー ok-raw クラス | `gpcb-copy-ok-raw` |
| 折りたたみオーバーレイクラス | `gpcb-fold-overlay` |
| 折りたたみ状態クラス | `gpcb-fold-collapsed` |
| ツールバー折りたたみボタン属性 | `data-gpcb-fold-btn` |
| 総行数表示クラス | `gpcb-linecount` |
| pluginActivators キー | `growi-plugin-codeblock-extended` |

## ハマりどころ（必読）

### 1. `dist/` を git にコミットすること

GROWI はプラグインインストール時に **`pnpm install` も `pnpm build` も実行しない**。GitHub の archive zip を展開し、`dist/` 配下を Express で静的配信するだけ。

→ `.gitignore` に `dist/` を含めると GROWI 側で JS が読み込まれない。`dist/` は必ずコミットすること。

### 2. Vite のマニフェスト出力先

GROWI が読みに行く manifest のパスは以下の順で fallback:

1. `dist/.vite/manifest.json` (Vite 5 デフォルト)
2. `dist/manifest.json` (Vite 4 互換 / 明示設定時)

Vite 5+ では `vite.config.ts` で `build.manifest: 'manifest.json'` を明示してプロジェクト直下風のパスに出力するのが無難。

### 3. `<pre>` を wrapper で包まず内部に prepend する

`<pre>` を `<div>` で包む（wrap）と GROWI のページレイアウトで親要素のスタイルに依存している箇所を壊すリスクがある。また MutationObserver の `childList` 監視で追加ノードの `querySelector('pre')` がヒットして無限スキャンループが起きる恐れがある。

**解決策**: `<pre>` 自体を `position: relative`（CSS class `gpcb-enhanced` に内包）にし、`<div class="gpcb-toolbar">` を `pre.prepend(toolbar)` で子として挿入する。toolbar は `position: absolute; top/right` で右上に配置。

### 4. MutationObserver の自己ループ防止

`pre.prepend(toolbar)` が発火させる `childList` mutation で追加ノードとして `toolbar` div が検出される。`el.classList.contains('gpcb-toolbar')` でスキップすることで無限スキャンを防ぐ。

### 5. `<code>` の DOM を一切触らない

hljs / Prism のシンタックスハイライトは `<code>` 内部に `<span class="hljs-*">` などのトークン span を生成している。コピー時は `code.textContent ?? ''` だけ取得し、DOM 構造には一切手を加えないこと。行番号（Step 3 以降）も `<code>` 内部の wrap ではなく隣接 `<aside>` で実現する。

### 6. 再インストールが必要

コード更新を push しても、GROWI 管理画面で「有効/無効トグル」だけでは zip が取り直されない。確実に反映するには `/admin/plugins` で **削除 → 再インストール**。

### 7. `hashchange` 購読が必須

Edit → View 遷移で `location.hash` のみが変わる場合、`pushState` のモンキーパッチは発火しない。`hashchange` イベントの購読が必須。

### 8. `:scope > code` は GROWI で機能しない

GROWI のシンタックスハイライト（Prism 系）は `<pre>` と `<code>` の間にインラインスタイル付きの `<div>` を挿入する:

```html
<pre>
  <div style="background: rgb(40, 44, 52); padding: 1em; ...">
    <code class="language-python">...</code>
  </div>
</pre>
```

`:scope > code` は直下子のみにマッチするため常に `null` を返す。**必ず `querySelector('code')` を使うこと**。

### 9. コピーボタンの `clearTimeout` を cleanupBlock で必ず呼ぶ

2 秒フィードバックのタイマーが残った状態で `unmount()` が呼ばれると、タイマー発火後に削除済みボタンへ `classList.remove` 等が走り例外が起きる恐れがある。`blockRefs.copyTimerId` を `cleanupBlock` 内で `window.clearTimeout` してから `blockRefs.delete(pre)` すること。

### 10. GROWI デフォルトの `<cite class="code-highlighted-title">` を CSS で隠す

GROWI は ` ```言語:ファイル名 ` 記法で `<pre>` の中に `<cite class="code-highlighted-title">ファイル名</cite>` を挿入する。本プラグインはこの `<cite>` の textContent を読み取って独自の `<span class="gpcb-filename">` を生成し、元の `<cite>` を CSS `pre.gpcb-enhanced .code-highlighted-title { display: none }` で非表示にする。

DOM ノード自体は残すこと（`cite.remove()` などはしない）。`unmount()` で `pre.gpcb-enhanced` クラスが外れれば CSS スコープが解除され、GROWI デフォルト表示に自動復帰する。

### 11. ファイル名ラベルのレイヤー配置（CSS のみで実現）

ラベル（`.gpcb-filename`）はコードブロック本体（Prism の内側 `<div>`）の **下レイヤー**に見えるよう配置する。JS は使わず CSS のみで実現している。

- **`padding-bottom: 10px`**: ラベル下部に余白を設ける
- **`margin-bottom: -12px`**: コードブロックをラベル底部まで引き上げ、底部 `padding` をコードブロックの背景で覆う
- **DOM 順序**: `<span class="gpcb-filename">` が先、Prism 内側 `<div>` が後 → 後から来る要素が前の要素を上書き描画するため、JS や `z-index` 操作なしでコードブロックがラベル上に重なる

ツールバーのトップ位置（`:has(> .gpcb-filename)` ルール）はラベルの各寸法を考慮した `calc()` 式で計算する:
```
コードブロック開始位置 = top-pad(6px) + text(1.05rem) + bottom-pad(10px) + margin(-12px) + Prism margin(0.5rem)
                       = 4px + 1.55rem
ツールバー top        = 4px + 1.55rem + 0.4rem = 4px + 1.95rem
```

### 12. Prism 内側 div の `display: flex !important`

行番号 `<aside>` を `<code>` と横並びにするため、Prism 内側 div のインライン `display: block` を CSS で `display: flex !important` に上書きしている。インラインスタイルを上書きするため `!important` が必要。`.gpcb-code-wrap` 側は `flex: 1 1 auto; min-width: 0; overflow-x: auto;` を当てて、横スクロール領域をここに閉じ込める。これにより `<aside>` は自然に左固定になる（`position: sticky` などのハックは不要）。

`unmount()` で `pre.gpcb-enhanced` クラスが外れれば CSS スコープが解除され、Prism 内側 div は元の `display: block` に戻る。

### 13. `{hl=3,5-7}` のカンマ曖昧性とルックアヘッド正規表現

`{start=10,hl=3,5-7}` を単純に `,` で split すると `hl` の値 `3,5-7` が `3` と `5-7` に正しく分割されるが、`{start=10,hl=3,5-7,end=20}` のような形では `end=20` まで `hl` の値に取り込まれてしまう。

解決策: key=value の抽出に「次の `key=` が来るまで」を lookahead で吸収する正規表現を使う:
```
/(\w+)\s*=\s*([^=]*?)(?=,\s*\w+\s*=|$)/g
```
これで value 部分が「次の `key=` の直前まで」に限定され、`hl` の値内カンマと key 区切りカンマを正しく識別できる。

### 14. ハイライトオーバーレイの flex column 等分割

`<code>` の各行高さを JS で計測せずにオーバーレイ行を各行に揃える手法:

- `.gpcb-code-wrap` の高さ = `<code>` のコンテンツ高さ
- `.gpcb-hl-overlay` は `position: absolute; top: 0; height: 100%` で code-wrap と同高
- N 個の `<div class="gpcb-hl-line">` に `flex: 1 1 0` を当てると等分割され、各 div の高さが 1 行分の高さに一致する
- `getComputedStyle().lineHeight = 'normal'` の解釈がブラウザ依存であることを回避できる

### 15. `isolation: isolate` で overflow fade が toolbar を覆う問題を防ぐ

`gpcb-code-outer` の `::before` / `::after`（疑似要素）には `z-index: 3` を設定している。一方 `.gpcb-toolbar` は `z-index: 1`。両者が同じ `<pre>` のスタッキングコンテキストに参加すると、フェードが toolbar の上に描画されてコピーボタンを視覚的に覆ってしまう（`pointer-events: none` なのでクリックは通るが見た目が崩れる）。

**解決策**: `gpcb-code-outer` に `isolation: isolate` を付与して独立したスタッキングコンテキストを形成する。これにより内部の `z-index: 3` は外部に影響しなくなり、`<pre>` コンテキストでは `gpcb-code-outer` が `z-index: auto`（= 0 扱い）として評価される。`gpcb-toolbar` の `z-index: 1` が常に前面になる。

新たに `position` を持つ要素を `gpcb-code-outer` 内部に追加するときは、`z-index` が `gpcb-code-outer` 内で完結していることを意識すること。

### 16. オプション指定は `言語:{...}`（コロンあり・1 つの `{...}`）でなければならない

**制約 1: コロンなしではオプションが検出できない**

GROWI のコードフェンスパーサーは `:` をセパレータとして `言語:ファイル名` 形式を処理し、ファイル名部分（`{...}` を含む）を `<cite class="code-highlighted-title">` に書き出す。このプラグインの `findLinenumSpec` は `<cite>` からオプションを抽出するため、コロンなしでは `{...}` が DOM に現れず検出不可能。

- ✓ `python:{start=10}` — cite に `{start=10}` が入る → 検出可
- ✓ `python:file.py{start=10}` — cite に `file.py{start=10}` が入る → 検出可
- ✗ `python{start=10}` — `{...}` が `<code>` クラス名にも `<cite>` にも現れない → 検出不可
- ✗ `python{hl=3}` — 同上
- ✗ `python{diff}` — 同上

この制約は `{start}` / `{hl}` / `{diff}` すべてに共通。コロンなし形式はこのプラグイン側では対応不可能（GROWI 本体の DOM 構造による制限）。

**制約 2: 複数の `{...}` ブロックは先頭 1 つしか読み取られない**

`findLinenumSpec` で使用している `SPEC_RE = /\{([^}]+)\}/`（`g` フラグなし）が最初のマッチのみを返す仕様のため。

- ✓ `python:{start=10,hl=3,diff}` — 1 つにまとめる → 全オプション有効
- ✗ `python:{start=10}{hl=3}` — `{start=10}` のみ有効、`{hl=3}` は無視
- ✗ `python:{start=10}{hl=3}{diff}` — `{start=10}` のみ有効

なお `setupFilenameLabel` 内の `replace(/\s*\{[^}]*\}\s*$/, '')` で末尾の `{...}` は除去されるため、`python:{diff}` や `python:{start=10}` のようにファイル名なしでオプションのみを書いた場合、ファイル名ラベルは表示されない（空文字列になり早期 return）。

### 17. ハイライトオーバーレイの横スクロール追従

`position: absolute; left: 0; right: 0` を `overflow-x: auto` コンテナ内に置くと、オーバーレイ幅は visible 幅に固定される。スクロールするとオーバーレイも動くが `left: 0; right: 0` は containing block の visible 幅なので、結果として visible 幅の領域しかカバーできない。

解決策: CSS は `left: 0; right: 0` のままとし、JS で scroll イベントに `transform: translateX(scrollLeft)` を適用する。オーバーレイを右へシフトすることで「常に現在の visible 領域をカバー」する効果を得る。layout 計測（`scrollWidth` 等）が不要で、`requestAnimationFrame` 起因のタイミング問題も発生しない。

`code.scrollWidth` を rAF で読んで `width` に設定する方法は **layout が確定していない場合に 0 を返す** ため採用しないこと（実際にハマった）。

### 18. `overflow-x: auto` による `overflow-y` の暗黙的 auto 昇格

CSS Overflow Level 3 仕様により、`overflow-x` が `visible` 以外に設定されると **`overflow-y: visible` が暗黙的に `auto` に昇格**する。`.gpcb-code-wrap` に `overflow-x: auto` を設定すると実質 `overflow: auto`（両軸）となり、コンテンツ高さがコンテナ高さを 1〜2px 上回るケース（フォントのサブピクセル丸め差）で縦スクロールバーが発生する。

**解決策**: `.gpcb-code-wrap` に `overflow-y: clip` を明示する。`clip` は `hidden` と異なりスクロールコンテナを形成しないため、内部の `position: absolute` 要素（`.gpcb-hl-overlay`）や fold inner の参照計算に副作用がない。

### 19. fold の `removeProperty` は CSS プロパティ名（ケバブケース）が必要

`element.style.removeProperty()` は CSS プロパティ名（ケバブケース）を引数に取る。`removeProperty('paddingBottom')` は**無効**で、`removeProperty('padding-bottom')` が正しい。JS の `style.paddingBottom = ''` は代入で消せるが、`removeProperty` を使う場合は必ずケバブケースで指定すること。

`cleanupBlock` や `doCollapse` 内の `inner.style.removeProperty('padding-bottom')` はこの仕様通りに実装済み。

## デプロイ手順

```bash
pnpm build              # dist/ を更新
git add src/ dist/ ...  # 変更ファイルを staging
git commit -m "..."
git push
```

GROWI 管理画面 `/admin/plugins` で **削除 → 再インストール**。

## 動作確認チェックリスト

1. `pnpm build` が成功し `dist/manifest.json` が出力される
2. GROWI で削除 → 再インストール後、DevTools Network で `client-entry-*.js` が 200 で取得される
3. コードブロック付きページを開き、`<pre>` にマウスオーバーするとコピーボタンが右上に表示される
4. ボタンクリックでコード全体がクリップボードにコピーされる（`<code>` の textContent 完全一致）
5. コピー成功時に 2 秒間 ✓ アイコン + 緑フラッシュが表示される
6. クリップボード API が拒否された場合は ✕ アイコン + 赤フラッシュが表示される
7. `<pre data-no-copy>` 属性付きにはコピーボタンが出ない
8. 編集モードへ遷移するとコピーボタンが消える（cleanupBlock）
9. 編集モードから戻るとコピーボタンが再生成される
10. SPA 遷移後の新ページのコードブロックも自動拡張される
11. `/admin` 配下ではコピーボタンが出ない
12. 印刷プレビューでコピーボタンが非表示になる
13. ダークモード切替（OS / GROWI UI トグル）でボタン配色が追従する
14. `prefers-reduced-motion: reduce` 環境でフラッシュアニメが無効になる
15. プラグイン無効化（`unmount`）で全 `<pre>` から `gpcb-*` クラス・`data-gpcb-enhanced`・toolbar が完全に消える
16. `<code>` の innerHTML が処理前後で完全一致（差分ゼロ）
17. `.CodeMirror` / `.cm-editor` 配下の `<pre>` にはボタンが出ない（GROWI エディタとの競合なし）
18. ` ```hcl:test.tf ``` 形式でコードブロック左上にファイル名ラベルが表示される
18a. ` ```python:app.py ``` でラベル左端に Python カラーアイコンが表示される
18b. ` ```unknown:file.txt ``` など未登録言語では汎用ファイルアイコン（白半透明）が表示される
18c. ` ```none:config.env{lang=bash} ``` で Bash アイコンが表示される
18d. `<pre data-no-lang>` で言語アイコンが非表示になる（ファイル名ラベルは出る）
19. ` ```hcl ``` （ファイル名なし）ではラベルが出ない
20. ラベルテキストをマウスで選択・コピーできる
21. `<pre data-no-filename>` でラベルが非表示になる（コピーボタンは出る）
22. `<pre data-no-copy>` でコピーボタンが非表示になる（ラベルは出る）
23. 印刷プレビューでファイル名ラベルが薄いグレー背景・黒文字で表示される
24. ラベルあり・なしでコピーボタンの位置が揃っている（ともにコードエリア上端から 0.4rem 内側）
25. 行番号がコードブロック左側に薄いグレーで表示される
26. 行番号の数が実際のコード行数と一致する（末尾改行は除外）
27. `<pre data-no-linenum>` で行番号が出ない（コピーボタン・ラベルは出る）
28. コピーボタンで行番号がクリップボードに混入しない
29. 横スクロール時に行番号が左に固定される
30. 印刷プレビューで行番号が非表示になる
31. `unmount` 後に `<aside class="gpcb-linenums">` / `.gpcb-code-wrap` / `.gpcb-hl-overlay` が消え、Prism 内側 div の flex 上書きが外れる
32. ` ```python:{start=10} ` で行番号が 10 から始まる（コロンあり・ファイル名なし）
33. ` ```python:{hl=3} ` で 3 行目の背景（コード・行番号とも）がハイライトされる
34. ` ```python:{hl=3,5-7} ` で 3・5・6・7 行目がハイライト、4 行目は非ハイライト
35. ` ```python:{start=10,hl=12,14-16} ` で表示番号 12・14・15・16 がハイライト（コード 3・5・6・7 行目）
36. ` ```python:file.py{start=10,hl=12} ` でファイル名ラベルに「file.py」のみ表示（`{...}` は除去）
37. ` ```python:file.py ` でファイル名のみ指定でも `{...}` なしで壊れない
37a. ` ```python{start=10} `（コロンなし）では行番号が 1 から始まる（オプション無視・仕様通り）
37b. ` ```python:{start=10}{hl=3} `（複数 `{...}`）では `{start=10}` のみ有効、`{hl=3}` は無視される
38. `data-no-linenum` 付き `<pre>` はハイライトオーバーレイも生成しない
39. ハイライト行は横スクロール時も背景が画面端まで継続して表示される
40. コピーボタンでコピーした内容に行番号・ハイライトオーバーレイの文字が含まれない
41. ` ```diff ` ブロックで追加行（`+`）が緑背景・削除行（`-`）が赤背景・ハンク行（`@@`）が紫背景で表示される
42. ` ```diff ` ブロックの左ガターに `+` / `−` / `@` 記号が表示される
43. `+++` / `---` で始まるファイルヘッダー行は hunk 扱い（紫背景・行番号なし）
44. ` ```python:{diff} ` でシンタックスハイライト（Python 色）と diff 背景色・ガターが共存する
45. ` ```python:src/app.py{diff} ` でファイル名ラベル・シンタックスハイライト・diff 表示が共存する
46. `python:{diff}` のとき `{diff}` がファイル名ラベルに表示されない
47. ` ```python{diff} ` （コロンなし）は diff 表示にならず通常の Python コードブロックとして扱われる（ハマりどころ #16 参照）
48. `<pre data-no-diff>` で diff ガター・背景色が非表示になる（コピーボタン・ファイル名ラベルは出る）
49. diff ブロックで行番号が表示される（追加行・コンテキスト行のみ番号を振る。削除行・ハンク行には番号がつかない）
50. diff ブロックの横スクロール時に背景色オーバーレイが追従する
51. `unmount` 後に `<aside class="gpcb-diff-gutter">` / `<aside class="gpcb-linenums">` / `.gpcb-code-wrap` が DOM から消える
52. diff ブロックで通常クリックすると新コードのみがコピーされる（`+`/空白の先頭記号が除去され、削除行・ハンク行は含まれない）
53. diff ブロックで Shift+クリックすると raw diff テキスト（`+`/`-`/`@@` を含む元テキスト）がコピーされる
54. diff raw コピー後は青 ± バッジが 2 秒間表示され、通常コピーの緑 ✓ と視覚的に区別できる
55. コピーボタンにホバーすると 0.2s 後に tooltip が表示される（ブラウザ標準より速い）
56. diff ブロックの tooltip に "Shift+Click: Copy RAW Diff" のヒントが含まれる
57. コピー後（フィードバック中）もホバーを維持すれば tooltip が表示され続け、マウスを外すと 1.5s かけてゆっくり消える
58. 印刷プレビューでコードブロックが白背景・黒文字・枠線付きで表示される（Shiki / Prism のインラインスタイルが上書きされる）
59. 印刷プレビューで長い行が折り返して表示される（横スクロールが発生しない）
60. 印刷プレビューで diff ガターが非表示になる
61. ` ```python:{fold} ` で 8 行を超えるブロックが折りたたまれた状態で表示される
62. 折りたたみブロックのラベルバー右端に「N lines」が表示される
63. ファイル名なしの折りたたみブロック（` ```python:{fold} `）でもラベルバーが表示され行数が確認できる
64. 8 行以下のブロックに `{fold}` を付けても fold UI が表示されない（行数 ≤ 閾値は skip）
65. 「▼ Expand」クリックで展開アニメーション後に「▲ Collapse」ボタンが表示される
66. 展開時、コード末尾と「▲ Collapse」ボタンが重ならない（padding-bottom により離れている）
67. ツールバーのトグルボタンで展開/折りたたみが切り替わる（アイコンと tooltip も追従する）
68. 折りたたむと画面スクロール位置が折りたたみ前と同じ位置に保たれる（上方向にずれない）
69. `{fold=15}` で 15 行まで表示され 16 行目以降が折りたたまれる
70. 展開アニメーション中に折りたたみボタンを押しても状態が壊れない（animGen 競合防止）
71. 折りたたみ中でも Ctrl+F のページ内検索がヒットする
72. 印刷プレビューで fold が解除されて全コードが表示される
73. `<pre data-no-fold>` で fold が適用されない
74. `{fold}` と `{hl=...}` の組み合わせでハイライトが正常に表示される
75. `{fold}` と `{start=N}` の組み合わせで行番号が N から始まる
76. `unmount` 後に `gpcb-fold-collapsed` / `gpcb-fold-overlay` が消え、inner div のインラインスタイルが除去される

## 会話ガイドライン

- 常に日本語で会話する

## 作業ルール

- **git 操作は行わない**。`git add` / `git commit` / `git push` / `git restore` / `git checkout` などの git コマンドは一切実行しないこと。コミットやプッシュが必要な場面ではユーザーに依頼し、こちらでは行わない。
  - 変更内容のサマリだけ提示し、コミットメッセージ案を出す程度に留める。
  - 例外として `git status` / `git log` / `git diff` などの**読み取り専用**コマンドは状況把握のために実行してよい。
- **pnpm 操作は Claude が行う**。`pnpm install` / `pnpm approve-builds` / `pnpm build` / `pnpm audit` はこちらで実行する。

- **セキュリティチェックを必ず行う**。コード変更を完了したら、コミット候補としてユーザーに提示する前に以下を確認すること。問題が見つかった場合はその場で修正するか、ユーザーに明示的に報告する。
  - **機密情報の混入**: API キー / トークン / パスワード / 秘密鍵 / `.env` 系ファイルの値が、ソースコード・コメント・`dist/` 配下のビルド成果物に含まれていないか。
  - **XSS / 危険な HTML 挿入**: ユーザー入力を `dangerouslySetInnerHTML`・`innerHTML` で未エスケープで埋め込んでいないか。DOM 操作は `createElement` + `setAttribute` のみを使うこと。
  - **外部通信**: 外部 URL に対する `fetch` / `XMLHttpRequest` を新規追加していないか。
  - **依存パッケージの脆弱性**: 新規追加した npm パッケージは `pnpm audit` を実行して確認する。
  - **CSP / 外部リソース**: `<script>` / `<link>` を動的挿入して外部ドメインから読み込む実装になっていないか。自己完結なバンドルにすること。
