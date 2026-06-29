# CLAUDE.md

## プロジェクト概要

- **名前**: `growi-plugin-codeblock-extended`
- **種別**: GROWI Script プラグイン
- **目的**: GROWI ページ本文中の Markdown コードブロック（`<pre><code>`）にコピーボタン・言語ラベル・行番号・折りたたみ・全画面表示などの機能を追加する

### 実装済み機能

| 機能 | 説明 |
|---|---|
| ファイル名ラベル | `言語:ファイル名` 記法時のみ、コードブロック左上にタブ風で表示。コードブロック本体の下レイヤーに配置し（`padding-bottom` + 負の `margin-bottom` で底部を潜り込ませる）、ラベルテキストは選択可能。GROWI デフォルトの `<cite class="code-highlighted-title">` は CSS で非表示にして置き換える。`data-no-filename` で opt-out |
| コピーボタン | コードブロック右上にボタンを**ホバー時のみ表示**（Zenn 風 UI）。クリックで `<code>` の `textContent` をクリップボードにコピー |
| 成功/失敗フィードバック | コピー成功時: 2 秒間 ✓ バッジ + アイコン緑変化。失敗時: ✕ アイコン赤変化（2 秒後に元に戻る） |
| `navigator.clipboard` 非対応 | ボタンを非生成（早期 return） |
| opt-out 属性 | `<pre data-no-copy>` でコピーボタンを非表示（ソート等は無関係） |
| 非表示条件 | 編集モード（`/edit`, `#edit`, `body.editing`, `body.grw-editor-mode`, `body.modal-open`）・管理画面（`/admin`）・印刷時はボタン非表示 |
| SPA 遷移 | `pushState` / `replaceState` モンキーパッチ + `popstate` + `hashchange` で再スキャン |
| 動的追加対応 | `MutationObserver` で `<pre>` 追加を検知して自動初期化 |
| エディタ DOM 除外 | `.CodeMirror` / `.cm-editor` / `[contenteditable="true"]` 配下の `<pre>` は対象外 |
| deactivate | 全 listener 解除・MutationObserver.disconnect・モンキーパッチ復元・toolbar 削除・付与した `gpcb-enhanced` クラスと `data-gpcb-enhanced` 属性を全削除。`<code>` の中身は完全無変更 |
| ダークモード | `@media (prefers-color-scheme: dark)` と `html[data-bs-theme="dark"]`（Bootstrap 5.3 GROWI UI トグル）の双方で CSS 変数を上書き |
| reduced-motion | `prefers-reduced-motion: reduce` 環境ではフラッシュアニメなし |
| 行番号 | コードブロック左側に `<aside class="gpcb-linenums">` を並置。Prism 内側 div を `display: flex !important` で flex 化し、`<aside>`（flex-shrink: 0）と `.gpcb-code-wrap`（`overflow-x: auto`）を横並び。`<code>` の DOM は不変。`data-no-linenum` で opt-out |
| コードスクロールコンテナ | `<code>` を `<div class="gpcb-code-wrap">` で包んで `overflow-x: auto` をここに限定。`<aside>` は flex item として外側に置くため横スクロール時に左固定になる（`position: sticky` 不要） |
| 開始行番号指定 | コードフェンスに `{start=N}` を付けると行番号を N から開始。`findLinenumSpec` で `<code>` className または `<cite>` テキストから `{...}` を抽出し、`parseLinenumSpec` で解析 |
| 行ハイライト | `{hl=行番号[,範囲...]}` で指定行の背景を強調。コード側は `.gpcb-code-wrap` 内の絶対配置 flex column オーバーレイ（`.gpcb-hl-overlay`）、行番号 aside 側は対応 `<span>` に `.gpcb-linenum-hl` クラスを付与 |
| 差分表示 | `language-diff` ブロックまたは `{diff}` 修飾子付きブロックで diff ガター（`<aside class="gpcb-diff-gutter">`）と背景オーバーレイを生成。追加行=緑・削除行=赤・ハンク行=紫。`language-diff` ブロックは Prism/Shiki のトークン背景色を `background: none !important` でリセット（文字色は残す）。行番号は自動無効化。`data-no-diff` で opt-out |
| ハイライト横スクロール追従 | オーバーレイは `left: 0; right: 0`（visible 幅固定）。`codeWrap` の scroll イベントで `hlOverlay.style.transform = translateX(scrollLeft)` を更新しビューポート追従させる（layout 計測不要） |
| 印刷 | `@media print` で `.gpcb-toolbar` / `.gpcb-linenums` / `.gpcb-hl-overlay` を非表示 |

### 今後のロードマップ（未実装・ブランチを分けて順次実装）

| Step | 機能 | opt-out 属性 |
|---|---|---|
| Step 4 | 折りたたみ（行数閾値超過時に max-height 制限 + 展開ボタン） | `data-no-fold` |
| Step 5 | 全画面（`<dialog>` に `cloneNode(true)` してモーダル表示、Esc で閉じる） | `data-no-full` |
| Step 6+ | ユーザーと 1 つずつ相談しながら追加 | — |

> **実装済み追加機能（ロードマップ外）**: 差分表示（Step 3.5 相当）

## アーキテクチャ

このプラグインは Markdown レンダリングの拡張ではなく **DOM 直接操作** を行う。`customGenerateViewOptions` は使わず、`activate()` 内で既存の `<pre>` をスキャンして機能を注入し、`MutationObserver` で動的追加にも追従する。

**ブランチ運用方針**: 機能ごとに git ブランチを分けて実装・確認し、マージする。

### ファイル構成

```
growi-plugin-codeblock-extended/
├── client-entry.tsx                       # activate / deactivate + pluginActivators 登録
├── src/
│   ├── codeBlockExtended.ts              # コア実装（スキャン・コピー・SPA 遷移・クリーンアップ）
│   ├── types.ts                           # Window 型の最小宣言
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
  2. `blockRefs.set(pre, { toolbar, filenameLabel: null, lineNums: null, codeWrap: null, hlOverlay: null, hlScrollHandler: null, copyBtn: null, copyHandler: null })` で WeakMap に登録
  3. `setupCopyButton(toolbar, code, pre)` — `navigator.clipboard.writeText` が利用可能かつ `data-no-copy` がなければボタンを生成
  4. `pre.classList.add('gpcb-enhanced')`、`pre.prepend(toolbar)`
  5. `setupFilenameLabel(pre)` — `data-no-filename` がなく `<cite class="code-highlighted-title">` が存在すれば、その textContent を `<span class="gpcb-filename">` として prepend（DOM 順: [filename, toolbar, 元の中身]）
  6. `setupLineNumbers(pre, code)` — `data-no-linenum` がなく Prism 内側 div が存在すれば、行数算出・spec 解析・aside 生成・code-wrap 生成・hlOverlay 生成・scroll リスナー登録を行う
  7. `pre.setAttribute('data-gpcb-enhanced', '1')`

- **`handleCopyClick(code, btn, pre)`**: `code.textContent ?? ''` を `navigator.clipboard.writeText` に渡す。成功時は `flashCopyState(btn, 'ok', pre)`、失敗時は `flashCopyState(btn, 'fail', pre)` を呼ぶ。

- **`flashCopyState(btn, state, pre)`**: `blockRefs` WeakMap から既存タイマーを取り出してクリアし、`setCopyBtnState` でアイコン・クラス・aria-label を更新。2 秒後に元の状態に戻す `setTimeout` id を `blockRefs.copyTimerId` に保持する。

- **`setCopyBtnState(btn, state)`**: ボタンの子要素を全削除してから `COPY_BTN_STATE_MAP` のアイコン生成関数を呼び、結果を `appendChild`。`innerHTML` は使わない。

- **`setupLineNumbers(pre, code)`**: ① `code.textContent` から行数算出（末尾改行除外）② `findLinenumSpec` → `parseLinenumSpec` で `{start=N,hl=...}` を解析 ③ `<aside class="gpcb-linenums">` を行数分の `<span>` で生成（highlight 行は `.gpcb-linenum-hl` クラス）④ `<div class="gpcb-code-wrap">` で `<code>` を包む ⑤ highlight 行があれば `<div class="gpcb-hl-overlay">` を `codeWrap.prepend` ⑥ scroll イベントリスナーを codeWrap に登録し `refs.hlScrollHandler` に保持 ⑦ aside を Prism 内側 div に prepend

- **`findLinenumSpec(pre, code)`**: `<code>` の className を先に確認（`language-xxx{...}` 形式）。なければ `<cite class="code-highlighted-title">` のテキストを確認（ファイル名あり記法では cite に `file.py{...}` が残る）。`SPEC_RE = /\{([^}]+)\}/` でマッチ。

- **`parseLinenumSpec(inner)`**: ルックアヘッド正規表現 `/(\w+)\s*=\s*([^=]*?)(?=,\s*\w+\s*=|$)/g` で key=value を抽出。`hl` の値内カンマ（例: `hl=3,5-7` の `,5-7`）を誤分割しないよう「次の key= が来るまで」を lookahead で吸収する。

- **`isDiffTarget(pre, code)`**: `isDiffBlock(code)`（`language-diff` クラス判定）または `hasDiffModifier(pre, code)`（`{diff}` 修飾子判定）のいずれかが true なら diff ブロックと見なす。`hasDiffModifier` は `findLinenumSpec` でスペック文字列を取得し、カンマ区切りで分割して `'diff'` と完全一致するパートがあるかを確認する。diff ブロックと判定された場合は `setupDiffView` のみを呼び `setupLineNumbers` は呼ばない。このため `{hl=...}` や `{start=...}` を同時に指定しても**黙って無視**される（仕様）。

- **`setupDiffView(pre, code)`**: `setupLineNumbers` と同様の構造で、①行テキストを改行分割 ②各行を `classifyDiffLine`（`@@` → hunk、`+++`/`---` → context、`+` → added、`-` → removed、他 → context）で分類 ③`<aside class="gpcb-diff-gutter">` にガター記号 span を生成 ④`<div class="gpcb-hl-overlay gpcb-diff-overlay">` に行分の div を生成（added/removed/hunk に対応クラス付与）⑤`<code>` を `<div class="gpcb-code-wrap">` で包む ⑥scroll リスナー登録。`data-no-diff` 属性があれば早期 return。行番号は生成しない（diff ブロックは自動的に行番号無効）。

- **`cleanupBlock(pre)`**: `blockRefs.get(pre)` から `copyTimerId`（`clearTimeout`）・`copyHandler`（`removeEventListener`）・`hlScrollHandler`（`codeWrap.removeEventListener`）を解除。`codeWrap` の子を全て親に移してから `codeWrap.remove()`（hlOverlay も連れて消える）。`lineNums`・`filenameLabel`・`toolbar` を `.remove()`。`gpcb-enhanced` クラスと `data-gpcb-enhanced` 属性を削除。`<code>` の中身は一切変更しない。`<cite class="code-highlighted-title">` は DOM から削除しない（CSS スコープが外れると自動復帰する）。

- **SPA 遷移検知**: `pushState` / `replaceState` にカスタムイベント `'growi-pcb-navigate'` をモンキーパッチ。`popstate` / `hashchange` も購読し、いずれも 2 段 `requestAnimationFrame` で DOM が安定してから `scanAndEnhance()` を実行。

- **MutationObserver**: `document.body` を `childList: true, subtree: true, attributes: true, attributeFilter: ['class']` で監視。追加ノード判定では **`.gpcb-toolbar` / `.gpcb-filename` / `.gpcb-linenums` / `.gpcb-code-wrap` / `.gpcb-hl-overlay` を持つ要素はスキップ**して自己追加による無限ループを防ぐ。Prism が enhance 済み `<pre>` に内側 div を後から挿入・差し替えした場合（`refs.lineNums.isConnected` が false）は scroll リスナーを解除してから `refs.lineNums / codeWrap / hlOverlay / hlScrollHandler` をリセットし `setupLineNumbers` を再実行。`body.class` 変化時（編集モード遷移）は `isHiddenContext()` を判定し、true なら全 enhanced `<pre>` を即 `cleanupBlock`、false なら `scheduleScan()`。

- **`isHiddenContext()`**: `/admin` / `/admin/*` パス、`#edit` / `/edit` サフィックス、`body.editing` / `body.grw-editor-mode` / `body.modal-open` クラスのいずれかで true を返す。

- **`isInEditorDOM(pre)`**: `pre.closest('.CodeMirror, .cm-editor, [contenteditable="true"]')` が null でなければ true。

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
| ファイル名ラベル属性 | `data-gpcb-filename` |
| 行番号 aside クラス | `gpcb-linenums` |
| 行番号ハイライトクラス | `gpcb-linenum-hl` |
| コードスクロールコンテナクラス | `gpcb-code-wrap` |
| ハイライトオーバーレイクラス | `gpcb-hl-overlay` |
| ハイライト行クラス | `gpcb-hl-line` / `gpcb-hl-line-hl` |
| diff ガタークラス | `gpcb-diff-gutter` |
| diff ガター記号クラス | `gpcb-diff-add` / `gpcb-diff-rm` / `gpcb-diff-hh` |
| diff オーバーレイ行クラス | `gpcb-diff-line-add` / `gpcb-diff-line-rm` / `gpcb-diff-line-hh` |
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

### 16. `{diff}` 修飾子は `言語:{diff}`（コロンあり）でなければならない

`python{diff}` と書いても `{diff}` は GROWI の DOM に現れないため、このプラグインは diff ブロックを検出できない。

**理由**: GROWI のコードフェンスパーサーは `:` をセパレータとして `言語:ファイル名` 形式を処理し、ファイル名部分を `<cite class="code-highlighted-title">` に書き出す。`python:{diff}` と書けば `{diff}` が `<cite>` に入り、`findLinenumSpec` が検出できる。コロンなしで `python{diff}` と書いた場合は `{...}` が `<code>` のクラス名にも `<cite>` にも現れない（GROWI/Prism のクラス正規化で消える）ため、このプラグイン側での対応は不可能。

- ✓ `python:{diff}` — cite に `{diff}` が入る → 検出可
- ✗ `python{diff}` — DOM に `{diff}` が残らない → 検出不可
- ✓ `python:src/app.py{diff}` — cite に `src/app.py{diff}` が入る → ファイル名 `src/app.py` を表示し、`{diff}` を検出

なお `setupFilenameLabel` 内の `replace(/\s*\{[^}]*\}\s*$/, '')` で `{...}` は除去されるため、`python:{diff}` のときファイル名ラベルは表示されない（空文字列になり早期 return）。

### 17. ハイライトオーバーレイの横スクロール追従

`position: absolute; left: 0; right: 0` を `overflow-x: auto` コンテナ内に置くと、オーバーレイ幅は visible 幅に固定される。スクロールするとオーバーレイも動くが `left: 0; right: 0` は containing block の visible 幅なので、結果として visible 幅の領域しかカバーできない。

解決策: CSS は `left: 0; right: 0` のままとし、JS で scroll イベントに `transform: translateX(scrollLeft)` を適用する。オーバーレイを右へシフトすることで「常に現在の visible 領域をカバー」する効果を得る。layout 計測（`scrollWidth` 等）が不要で、`requestAnimationFrame` 起因のタイミング問題も発生しない。

`code.scrollWidth` を rAF で読んで `width` に設定する方法は **layout が確定していない場合に 0 を返す** ため採用しないこと（実際にハマった）。

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
19. ` ```hcl ``` （ファイル名なし）ではラベルが出ない
20. ラベルテキストをマウスで選択・コピーできる
21. `<pre data-no-filename>` でラベルが非表示になる（コピーボタンは出る）
22. `<pre data-no-copy>` でコピーボタンが非表示になる（ラベルは出る）
23. 印刷プレビューでラベルが非表示になる
24. ラベルあり・なしでコピーボタンの位置が揃っている（ともにコードエリア上端から 0.4rem 内側）
25. 行番号がコードブロック左側に薄いグレーで表示される
26. 行番号の数が実際のコード行数と一致する（末尾改行は除外）
27. `<pre data-no-linenum>` で行番号が出ない（コピーボタン・ラベルは出る）
28. コピーボタンで行番号がクリップボードに混入しない
29. 横スクロール時に行番号が左に固定される
30. 印刷プレビューで行番号が非表示になる
31. `unmount` 後に `<aside class="gpcb-linenums">` / `.gpcb-code-wrap` / `.gpcb-hl-overlay` が消え、Prism 内側 div の flex 上書きが外れる
32. ` ```python{start=10} ` で行番号が 10 から始まる
33. ` ```python{hl=3} ` で 3 行目の背景（コード・行番号とも）がハイライトされる
34. ` ```python{hl=3,5-7} ` で 3・5・6・7 行目がハイライト、4 行目は非ハイライト
35. ` ```python{start=10,hl=12,14-16} ` で表示番号 12・14・15・16 がハイライト（コード 3・5・6・7 行目）
36. ` ```python:file.py{start=10,hl=12} ` でファイル名ラベルに「file.py」のみ表示（`{...}` は除去）
37. ` ```python:file.py ` でファイル名のみ指定でも `{...}` なしで壊れない
38. `data-no-linenum` 付き `<pre>` はハイライトオーバーレイも生成しない
39. ハイライト行は横スクロール時も背景が画面端まで継続して表示される
40. コピーボタンでコピーした内容に行番号・ハイライトオーバーレイの文字が含まれない
41. ` ```diff ` ブロックで追加行（`+`）が緑背景・削除行（`-`）が赤背景・ハンク行（`@@`）が紫背景で表示される
42. ` ```diff ` ブロックの左ガターに `+` / `−` / `@` 記号が表示される
43. `+++` / `---` で始まるファイルヘッダー行は context 扱い（色なし）
44. ` ```python:{diff} ` でシンタックスハイライト（Python 色）と diff 背景色・ガターが共存する
45. ` ```python:src/app.py{diff} ` でファイル名ラベル・シンタックスハイライト・diff 表示が共存する
46. `python:{diff}` のとき `{diff}` がファイル名ラベルに表示されない
47. ` ```python{diff} ` （コロンなし）は diff 表示にならず通常の Python コードブロックとして扱われる（GROWI の DOM 制約による仕様）
48. `<pre data-no-diff>` で diff ガター・背景色が非表示になる（コピーボタン・ファイル名ラベルは出る）
49. diff ブロックで行番号が表示されない
50. diff ブロックの横スクロール時に背景色オーバーレイが追従する
51. `unmount` 後に `<aside class="gpcb-diff-gutter">` / `.gpcb-diff-overlay` が DOM から消える

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
