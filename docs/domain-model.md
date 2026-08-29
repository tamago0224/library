# ドメインモデル

## 1. モデル方針

- 永続エンティティの内部IDにはULIDを使う
- ULIDは認可情報や秘密値として扱わず、原則として公開URLに使用しない
- UserとログインIdentityを分離する
- 作品Workと出版形態Editionを分離する
- ユーザー固有の情報を共有書誌情報へ直接持たせない
- 現在状態だけでなく、所有と読書の履歴を保存する

## 2. エンティティ一覧

| エンティティ | 役割 | 主な関連 |
| --- | --- | --- |
| User | サービス上の利用者 | Identity、Profile、UserWork |
| Identity | Googleログインとの対応 | Userに属する |
| Profile | ハンドル、表示名、公開設定 | Userと1対1 |
| HandleHistory | 過去のハンドルと転送先 | Userに属する |
| Work | 作品として共通の書誌情報 | Author、Edition |
| Author | 著者 | Workと多対多 |
| Edition | 単行本・文庫・電子版など | Workに属する |
| UserWork | 利用者と作品の関係 | メモ、状態、公開設定 |
| Ownership | 版の入手・手放し履歴 | UserWork、Edition |
| ReadingSession | 1回分の読書記録 | UserWork、Edition |
| Tag | ユーザー固有のタグ | UserWorkと多対多 |
| CatalogCorrection | 書誌情報の修正申請 | WorkまたはEdition |
| Report | 公開コンテンツへの通報 | User、対象リソース |
| Invitation | クローズドテストの招待 | 発行管理者、登録User |
| Session | ログインセッション | Userに属する |
| AuditLog | 運営操作などの監査記録 | Actorと対象リソース |

## 3. 概念的な関係

```text
User ──1:N── Identity
  │
  ├──1:1── Profile ──1:N── HandleHistory
  │
  └──1:N── UserWork ──N:1── Work ──1:N── Edition
              │                 └──N:M── Author
              ├──1:N── Ownership ──N:1── Edition
              ├──1:N── ReadingSession ──N:1── Edition
              └──N:M── Tag
```

## 4. 主要エンティティ

### 4.1 User

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| status | active / pending_deletion / suspended |
| termsAcceptedAt | 規約同意日時 |
| createdAt / updatedAt | 作成・更新日時 |
| deletionScheduledAt | 完全削除予定日時 |

### 4.2 Identity

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| userId | Userへの参照 |
| provider | 初期値は `google` |
| providerSubject | Googleが発行する不変の識別子 |
| email | 通知先。公開しない |
| createdAt / lastAuthenticatedAt | 登録・最終認証日時 |

`provider + providerSubject` を一意にします。

### 4.3 Profile

| 属性 | 内容 |
| --- | --- |
| userId | Userへの参照 |
| handle | 正規化済み公開用ID |
| displayName | 表示名 |
| bio | 自己紹介 |
| avatarKind | google / default |
| avatarUrl | Google画像を選択した場合のURL |
| visibility | public / private |
| defaultBookVisibility | public / private |
| allowSearchEngineIndexing | 検索エンジン掲載可否 |

`handle` は大文字小文字を区別せず一意とし、予約語を禁止します。

### 4.4 Work

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| title | 作品タイトル |
| synopsis | あらすじ |
| source | 外部サービスまたはmanual |
| createdBy | 手動登録者。外部取得時はNULL |
| createdAt / updatedAt | 作成・更新日時 |

### 4.5 Edition

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| workId | Workへの参照 |
| isbn13 / isbn10 | ISBN。存在する場合は一意 |
| format | hardcover / paperback / ebook / other |
| publisher | 出版社 |
| publishedOn | 発売日とその精度 |
| coverUrl | 利用条件を確認済みの表紙URL |

### 4.6 UserWork

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| userId / workId | 利用者と作品。組み合わせを一意にする |
| status | want_to_read / unread / reading / completed / abandoned |
| visibility | public / private |
| privateMemo | 本人だけが読める作品メモ |
| archivedAt | 本棚から非表示にした日時 |

### 4.7 Ownership

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| userWorkId / editionId | 所有者の作品と版 |
| kind | owned / borrowed |
| acquiredOn | 入手日と精度。未入力可 |
| disposedOn | 手放した日と精度。未入力可 |

`disposedOn` がない所有記録から現在の所有状態を求めます。未所有はOwnershipがない状態です。

### 4.8 ReadingSession

| 属性 | 内容 |
| --- | --- |
| id | ULID |
| userWorkId / editionId | 読んだ作品と版 |
| sequence | そのユーザーにおける何回目の読書か |
| result | reading / completed / abandoned |
| startedOn | 開始日と精度 |
| endedOn | 終了日と精度 |
| rating | 1〜5またはNULL |
| review | プレーンテキスト感想 |
| containsSpoilers | ネタバレ設定 |
| reviewEditedAt | 感想の最終編集日時 |

同じUserWorkに `result = reading` の記録を同時に複数作成できないよう制約を設けます。

### 4.9 部分日付

過去の読書日を柔軟に表現するため、日付と精度を組み合わせます。

```text
date:      2024-05-10 / 2024-05-01 / 2024-01-01 / NULL
precision: day        / month      / year       / unknown
```

画面表示と集計では `precision` より細かい情報を推測しません。

## 5. 状態遷移

### 5.1 読書状態

```text
読みたい ──入手──> 未読 ──開始──> 読書中 ──完了──> 読了
   │                    │              └──中断──> 中断
   └────直接開始────────┘

読了 / 中断 ──再読開始──> 読書中（新しいReadingSession）
```

読書中から読みたい・未読へ戻すときは、進行中の記録を中断として残すか、誤操作として削除するかを選択します。

### 5.2 プロフィール公開状態

```text
private ──公開──> public
public  ──非公開──> private
```

プロフィールを非公開にしてもUserWorkのvisibilityは変更しません。再公開時に本ごとの選択を復元します。

### 5.3 退会

```text
active ──退会申請──> pending_deletion ──7日経過──> 完全削除
                         └──取消──> active
```

`pending_deletion` へ移行した時点で公開データを隠し、全セッションを無効化します。

## 6. 集計ルール

- 作品平均評価には、プロフィールと本が公開されている各ユーザーの最新評価だけを使う
- 再読回数はReadingSessionの件数から求める
- 年別統計は年の精度以上、月別統計は月の精度以上の終了日だけを使う
- 日付不明の読了は全期間の総読了数に含める
- 公開統計には公開本だけ、本人向け統計には非公開本も含める
- 非公開本の存在を公開集計値やタグから推測できないようにする

## 7. 削除と統合

- 本棚から非表示にする操作は `archivedAt` を設定し、関連データを残す
- 完全削除は関連する個人データを同一処理内で削除する
- 作品・版の統合ではUserWork、Ownership、ReadingSessionの参照先を移し、重複を解消する
- 感想の編集・削除前の内容は、通報対応に必要な期間だけ監査領域へ保持する
