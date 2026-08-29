# 技術設計

## 1. 採用構成

| 領域 | 採用方針 |
| --- | --- |
| Webフレームワーク | TanStack Start + React + TypeScript |
| ルーティング | TanStack Router |
| アプリケーション実行環境 | Cloudflare Workers |
| データベース | 外部マネージドPostgreSQL（Cloudflare Hyperdrive経由） |
| ORM / migration | Drizzle ORM + drizzle-kit（migrationは管理ジョブ/CIから実行） |
| 認証 | Better Auth（Google OAuth 2.0 / OpenID Connect、Drizzle adapter） |
| 内部ID | ULID |
| 仕様サイト | VitePress |
| 仕様サイト配信 | GitHub Pages |

外部PostgreSQLの提供元、メール配信、書籍情報サービスは引き続き比較・決定します。Webの初期実装は `apps/web` にあり、Cloudflare公式ViteプラグインでWorkersへ出力します。

## 2. アプリケーション境界

```text
Browser
  ├── SSR / HTML ──────────────> TanStack Start on Workers
  └── Server Functions ────────> Web専用ユースケース

Future Mobile App
  └── /api/v1/* ───────────────> 公開API境界

TanStack Start
  ├── Application Services ────> 認可・ユースケース
  ├── Domain ──────────────────> 状態遷移・制約
  └── Repository ──────────────> PostgreSQL
```

Web画面だけが利用する処理にはServer Functionsを使います。将来のモバイルアプリからも利用する処理は、最初からApplication Serviceへ切り出し、`/api/v1/*` のServer Routesから呼び出せるようにします。

## 3. レンダリング方針

### SSR対象

- 未ログイン向けトップ
- 作品・版・著者ページ
- 公開プロフィール
- 公開本棚と公開感想

公開ページはSSRし、共有時の表示と検索エンジンによる取得に対応します。検索エンジン掲載を拒否したユーザーページには適切なrobots指定を返します。

### ログイン後画面

- 初期HTMLで認証状態と主要データを解決する
- 状態変更はServer Functionsを使う
- 楽観的更新を使う場合も、サーバー側の結果を正とする
- 検索条件と絞り込みは可能な範囲でURLへ保持する

## 4. 認証と認可

### 4.1 OAuth

- Authorization Code FlowとPKCEを使う
- `state` と `nonce` を検証する
- Googleの `issuer + subject` をIdentityへ保存する
- OAuthアクセストークンをブラウザのlocalStorageへ保存しない
- 必要以上のGoogleスコープを要求しない

### 4.2 セッションCookie

- `HttpOnly`
- `Secure`
- `SameSite=Lax` を基本とする
- `__Host-` 接頭辞を使用できる構成にする
- セッションIDをローテーションする
- 最終利用から30日で再認証する

### 4.3 認可

- 画面のルートガードは操作性のために使い、セキュリティ境界とはみなさない
- Server FunctionとServer Routeの両方で、対象リソースへの権限を検証する
- 非公開リソースの存在をエラー内容から推測させない
- 運営権限は通常ユーザーと明確に分離する

## 5. API方針

- 外部クライアント向けAPIは `/api/v1` 配下に置く
- JSONを基本形式とする
- 入出力をランタイムスキーマで検証する
- 認証済みでもリソース単位の認可を必須とする
- 一覧はカーソルページネーションを基本とする
- エラー形式を統一し、内部情報を返さない
- 破壊的変更はAPIバージョンを分ける
- 書き込みAPIには適切なレート制限を設ける

モバイル認証方式はアプリ着手時に決めます。Web用Cookieセッションを、そのまま外部アプリの仕様として固定しません。

## 6. PostgreSQL接続

接続方式はCloudflare Hyperdrive経由のPostgreSQL、`pg`、Drizzle ORMに決定し、`apps/web` に実装済みです。各リクエストでHyperdriveの接続文字列をWorker環境から読み取り、少数接続のrequest-scoped `pg` PoolとDrizzle facadeを生成します。処理終了時にはPoolを閉じ、接続文字列やPoolをモジュールグローバルへ保持しません。

PostgreSQLの提供元、リージョン、通信遅延、バックアップとPoint-in-Time Recovery、開発・ステージング・本番環境の分離は引き続き選定・確認します。DBマイグレーションはHTTPリクエスト処理中に実行せず、`DATABASE_URL` を使うdrizzle-kitをCIまたは管理された個別ジョブから実行します。

## 7. セキュリティ

- Server Functionsと状態変更APIにCSRF／同一オリジン対策を適用する
- すべての入力をサーバー側で検証する
- 感想とプロフィールはプレーンテキストとして保存・安全にエスケープ表示する
- OAuth、招待、検索、投稿、通報へ用途別のレート制限を設ける
- 秘密情報はCloudflareのSecretとして管理する
- ログへOAuthトークン、Cookie、メール、個人メモを出力しない
- 依存関係とGitHub Actionsを定期的に更新する

## 8. 可用性と運用

- 構造化ログとリクエストIDを使う
- 認証失敗、APIエラー、外部書籍API障害を監視する
- 外部書籍APIが停止しても既存の本棚を閲覧できるようにする
- PostgreSQLを自動バックアップする
- 復元手順を文書化し、定期的に確認する
- 集計処理は再計算可能な設計にする
- 退会時の完全削除を冪等なバックグラウンド処理にする

## 9. 性能方針

- 公開書誌情報は適切にキャッシュする
- 認証済み・非公開データを共有キャッシュへ保存しない
- 検索と一覧に必要なDBインデックスを設計する
- N+1クエリを避ける
- 表紙画像は許可された配信元と方法だけを使う
- 実測に基づいて目標値を確定する

## 10. テスト方針

| 種類 | 対象 |
| --- | --- |
| Unit | 状態遷移、公開判定、平均評価、部分日付集計 |
| Integration | PostgreSQL、OAuthコールバック、退会削除、作品統合 |
| API | 認証・認可、入力検証、エラー形式、レート制限 |
| E2E | 初回登録、本棚登録、再読、公開切替、通報、退会取消 |
| Security | 非公開データへの直接アクセス、CSRF、XSS、権限昇格 |

## 11. デプロイ

### アプリケーション

- Cloudflare Workersへデプロイする
- プレビュー、ステージング、本番を分離する
- DB変更は後方互換を保つ手順で適用する

### 仕様サイト

- `docs/` をVitePressでビルドする
- `main` ブランチへのpushでGitHub Actionsを起動する
- GitHub Pagesへ静的成果物を公開する
- リポジトリ名からベースパスを自動設定する
