# growi-plugin-codeblock-extended

GROWI ページ内の Markdown コードブロックを拡張する Script プラグイン。

## 機能

### 実装済み

- **言語ラベル** — コードブロック上部にラベル帯として言語名を常時表示（`language-*` クラスから抽出）。既知の言語は整形表示（例: `typescript` → `TypeScript`）、未知の言語はクラス名をそのまま表示。
- **コピーボタン** — コードブロックにマウスオーバーすると右上にコピーボタンが表示される。クリックでコード全体をクリップボードにコピー。
  - コピー成功時: 2 秒間 ✓ アイコン（緑）でフィードバック
  - コピー失敗時: 2 秒間 ✕ アイコン（赤）でフィードバック

### 予定（ブランチを分けて順次実装）

| Step | 機能 |
|------|------|
| Step 3 | 行番号 |
| Step 4 | 折りたたみ |
| Step 5 | 全画面表示 |

## 動作要件

- GROWI v7 以降（Script プラグイン対応）
- HTTPS 環境（`navigator.clipboard` API の利用に必要）

## インストール

GROWI 管理画面 `/admin/plugins` でこのリポジトリの URL を指定してインストール。

## opt-out 属性

機能ごとに独立して制御できる。

| 属性 | 効果 |
|------|------|
| `data-no-copy` | コピーボタンを非表示（言語ラベルは表示） |
| `data-no-lang` | 言語ラベルを非表示（コピーボタンは表示） |

```html
<pre data-no-copy><code>...</code></pre>
<pre data-no-lang><code>...</code></pre>
```

## 開発

```bash
pnpm install
pnpm build      # dist/ を更新
```

ビルド後は GROWI 管理画面でプラグインを削除 → 再インストールして反映する。
