# FF表

16進数の掛け算表です。

公開ページ：<https://tatt61880.github.io/ff_table/>

## 使い方

`index.html` をブラウザーで開くと使えます。操作方法はページ内の説明を参照してください。

## 開発・確認

```sh
npm ci
npx playwright install chromium
npm run lint
npm test
```

Linuxでブラウザーのシステム依存が不足している場合は、`npx playwright install --with-deps chromium` を使用してください。

依存関係は [package.json](package.json)、CIの実行環境と手順は [ワークフロー](.github/workflows/check.yml) を参照してください。

## 作者

[Tatt(たっと) @tatt61880](https://twitter.com/tatt61880)
