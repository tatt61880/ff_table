# FF表

1〜Fの16進数の掛け算表です。

公開ページ：<https://tatt61880.github.io/ff_table/>

## 使い方

`index.html` をブラウザーで開くだけで使えます。表示に外部ライブラリや通信は必要ありません。

- **計算を確認**：マスをタップ・クリックすると、行・列と計算式を強調表示します。マウスを重ねている間は、そのマスの計算を一時表示します。
- **表示の切り替え**：「16進数」「10進数」で見出しと答えを切り替えます。選んだ計算は両方の表記で確認できます。
- **0の段**：「0の段を表示」で追加できます。
- **暗記モード**：答えを隠し、選んだマスだけ「答えを見る」で確認できます。別のマスを選ぶと再び隠れます。
- **スマートフォン**：表の中を縦横にスクロールできます。行・列の見出しは端に固定されます。
- **印刷**：操作部分を省いて表全体を印刷します。暗記モードでは答えを隠したまま印刷できます。

表示の設定はブラウザーに保存します。保存を禁止している環境でも利用できますが、設定は次回に引き継がれません。

### キーボード

| キー | 操作 |
| --- | --- |
| Tab / Shift+Tab | 操作項目間を移動（表全体で1つのTab移動先） |
| 矢印キー | 表の中で選択するマスを移動 |
| Home / End | 現在の行の先頭 / 末尾へ移動 |
| Ctrl+Home / Ctrl+End | 表の左上 / 右下へ移動 |
| Enter / Space | 暗記モードで答えを表示 / 非表示 |

## 開発・確認

Node.js 24を使用します。Playwrightは開発時のブラウザーテスト専用です。

```sh
npm ci
npm run lint
npx playwright install chromium
npm test
```

Linuxでブラウザーのシステム依存が不足している場合は、`npx playwright install --with-deps chromium` を使用してください。

Firefox / WebKitでも同じテストを実行できます（POSIXシェルの場合）。

```sh
npx playwright install firefox webkit
TEST_BROWSER=firefox npm test
TEST_BROWSER=webkit npm test
```

テストでは全マスの計算、選択・ホバー、キーボード、暗記モード、設定保存の異常系、320〜1280pxの画面幅、ローカルファイルでの起動、印刷レイアウトを確認します。

GitHub ActionsではlintとChromiumでのテストを実行します。既存のPages配信ではHTML・CSS・JavaScript・画像だけを配置し、JS/CSSのハッシュ付きファイル名への変換を引き続き使います。

## 作者

[Tatt(たっと) @tatt61880](https://twitter.com/tatt61880)
