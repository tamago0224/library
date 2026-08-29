# Library

一般公開を目指す読書管理サービスのプロジェクトです。

現在はプロダクト仕様を策定しています。仕様書は `docs/` 配下にあり、VitePressで閲覧できます。

```bash
npm install
npm run docs:dev
```

本番用の静的サイトを確認する場合は、次を実行します。

```bash
npm run docs:build
npm run docs:preview
```

`main` ブランチへのpush時に、GitHub ActionsからGitHub Pagesへ自動公開する構成です。

## MVP foundation の状態

`apps/web` にはGoogle認証と認証済み `/app` のプレースホルダーまでを実装しています。現在は認証済みであれば `/app` に入れますが、次の機能はまだ実装していません。

- 招待制の検証・発行・失効
- 初回オンボーディング（13歳以上の確認、ハンドル設定など）
- 利用規約・プライバシーポリシーへの明示的な同意フロー
- `active` / `pending_deletion` / `suspended` の利用状態によるアクセス制御

これらは一般公開デプロイ前のブロッカーです。ログイン画面のGoogle認証だけで、規約同意や利用開始条件が完了することはありません。
