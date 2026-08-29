# Library Web

TanStack Start + React のCloudflare Workersアプリです。認証と永続化は実際の設定がある環境でのみ有効になります。認証を迂回する開発用ログインはありません。

## ローカル開発

```bash
cp .dev.vars.example .dev.vars
# .dev.vars に BETTER_AUTH_SECRET（32文字以上）と Google OAuth の値を設定
npm run web:dev
```

Google Cloud Console の承認済みリダイレクト URI に `http://localhost:3000/api/auth/callback/google` を登録します。`HYPERDRIVE` は `wrangler.jsonc` の設定IDを実環境のものへ置き換えます。ローカルでは `.dev.vars` の `DATABASE_URL` を使用できます。

### データベース

Workerのリクエスト処理ではCloudflare Hyperdriveの `HYPERDRIVE.connectionString` を優先し、Drizzle ORM + `pg` で接続します。接続が未設定の場合は、どの設定が必要かを示すエラーになります。マイグレーションはリクエスト中に実行しません。

```bash
# DATABASE_URLを設定した管理環境で実行
npm run db:generate --workspace @library/web
npm run db:migrate --workspace @library/web
```

Google OAuthの秘密情報、Better Authの秘密鍵、実際の接続文字列はコミットしないでください。Cloudflareでは `wrangler secret put BETTER_AUTH_SECRET` などで登録します。

## 一般公開前の未実装ブロッカー

この基盤スライスでは、招待制の検証・発行・失効、初回オンボーディング（13歳以上の確認とハンドル設定）、利用規約・プライバシーポリシーへの明示的な同意、ユーザー状態（`active` / `pending_deletion` / `suspended`）によるアクセス制御をまだ実装していません。現在の `/app` は認証セッションがあれば表示できるプレースホルダーであり、招待やオンボーディングを代替しません。一般公開デプロイ前にこれらを実装・検証する必要があります。
