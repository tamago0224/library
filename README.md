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
