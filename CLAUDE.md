# CLAUDE.md

## プロジェクト概要

- **名前**: `growi-plugin-codeblock-extended`
- **種別**: GROWI Script プラグイン
- **目的**: GROWI ページ本文中の Markdown コードブロック（`<pre><code>`）にコピーボタン・言語ラベル・行番号・折りたたみ・全画面表示などの機能を追加する

### 実装済み機能

| 機能 | 説明 |
|---|---|
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
| 印刷 | `@media print` で `.gpcb-toolbar` を非表示 |

### 今後のロードマップ（未実装・ブランチを分けて順次実装）

| Step | 機能 | opt-out 属性 |
|---|---|---|
| Step 2 | 言語ラベル表示（`language-*` クラスから抽出してバッジ表示） | `data-no-lang` |
| Step 3 | 行番号（`<aside class="gpcb-linenums">` を `<pre>` 内に並置、`<code>` は不変） | `data-no-linenum` |
| Step 4 | 折りたたみ（行数閾値超過時に max-height 制限 + 展開ボタン） | `data-no-fold` |
| Step 5 | 全画面（`<dialog>` に `cloneNode(true)` してモーダル表示、Esc で閉じる） | `data-no-full` |
| Step 6+ | ユーザーと 1 つずつ相談しながら追加 | — |

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
  - `data-no-copy` 属性が未付与
  - `pre.querySelector('code')` が存在する（**直下子ではなく子孫を検索**。GROWI の Prism が `<pre>` と `<code>` の間に `<div>` を挿入するため `:scope > code` は不可）
  - `isInEditorDOM(pre)` が false（`.CodeMirror` / `.cm-editor` / `[contenteditable="true"]` 配下でない）
  - `isHiddenContext()` が false

- **`enhanceCodeBlock(pre)`**: コーディネータ
  1. `<div class="gpcb-toolbar">` を生成
  2. `blockRefs.set(pre, { toolbar, copyBtn: null, copyHandler: null })` で WeakMap に登録
  3. `setupCopyButton(toolbar, code, pre)` — `navigator.clipboard.writeText` が利用可能な場合のみボタンを生成し `blockRefs` を更新
  4. `pre.classList.add('gpcb-enhanced')`、`pre.prepend(toolbar)`、`pre.setAttribute('data-gpcb-enhanced', '1')`

- **`handleCopyClick(code, btn, pre)`**: `code.textContent ?? ''` を `navigator.clipboard.writeText` に渡す。成功時は `flashCopyState(btn, 'ok', pre)`、失敗時は `flashCopyState(btn, 'fail', pre)` を呼ぶ。

- **`flashCopyState(btn, state, pre)`**: `blockRefs` WeakMap から既存タイマーを取り出してクリアし、`setCopyBtnState` でアイコン・クラス・aria-label を更新。2 秒後に元の状態に戻す `setTimeout` id を `blockRefs.copyTimerId` に保持する。

- **`setCopyBtnState(btn, state)`**: ボタンの子要素を全削除してから `COPY_BTN_STATE_MAP` のアイコン生成関数を呼び、結果を `appendChild`。`innerHTML` は使わない。

- **`cleanupBlock(pre)`**: `blockRefs.get(pre)` から `copyTimerId`（`clearTimeout`）・`copyHandler`（`removeEventListener`）・`toolbar`（`.remove()`）を取り出してクリーンアップ。`gpcb-enhanced` クラスと `data-gpcb-enhanced` 属性を削除。`<code>` の中身は一切変更しない。

- **SPA 遷移検知**: `pushState` / `replaceState` にカスタムイベント `'growi-pcb-navigate'` をモンキーパッチ。`popstate` / `hashchange` も購読し、いずれも 2 段 `requestAnimationFrame` で DOM が安定してから `scanAndEnhance()` を実行。

- **MutationObserver**: `document.body` を `childList: true, subtree: true, attributes: true, attributeFilter: ['class']` で監視。追加ノード判定では **`.gpcb-toolbar` を持つ要素はスキップ**して自己追加による無限ループを防ぐ。`body.class` 変化時（編集モード遷移）は `isHiddenContext()` を判定し、true なら全 enhanced `<pre>` を即 `cleanupBlock`、false なら `scheduleScan()`。

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
