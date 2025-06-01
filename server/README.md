# Rectropic Server

Rectropicアプリケーションのバックエンドサーバーです。Hono + Bunで構築されています。

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. データベースの設定

Tursoデータベースを準備し、環境変数を設定してください。

#### ローカル開発の場合

```bash
# .envファイルを作成
TURSO_DATABASE_URL=file:local.db
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
```

#### Tursoクラウドを使用する場合

1. [Turso](https://turso.tech/)でアカウントを作成
2. データベースを作成
3. 認証トークンを取得

```bash
# .envファイルを作成
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
```

### 3. データベースマイグレーション

```bash
# マイグレーションファイルの生成
bun run db:generate

# マイグレーションの実行
bun run db:push

# データベースの管理画面を開く（オプション）
bun run db:studio
```

### 4. サーバーの起動

```bash
# 開発モード
bun run dev

# 本番モード
bun run start
```

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン/会員登録
- `POST /api/auth/anonymous` - 匿名ログイン
- `POST /api/auth/verify` - トークン検証
- `POST /api/auth/logout` - ログアウト

### ユーザー
- `GET /api/users/profile` - プロフィール取得
- `PUT /api/users/profile` - プロフィール更新
- `POST /api/users/upgrade` - プレミアムプランアップグレード
- `GET /api/users/search` - ユーザー検索

### リスト
- `GET /api/lists` - リスト一覧取得
- `POST /api/lists` - リスト作成
- `GET /api/lists/:id` - 特定のリスト取得
- `PUT /api/lists/:id` - リスト更新
- `DELETE /api/lists/:id` - リスト削除
- `POST /api/lists/:id/invite` - メンバー招待
- `DELETE /api/lists/:id/members/:userId` - メンバー削除

### コンテンツ
- `POST /api/content` - コンテンツ追加
- `DELETE /api/content/:id` - コンテンツ削除
- `POST /api/content/:id/reaction` - リアクション追加/更新
- `DELETE /api/content/:id/reaction` - リアクション削除

## 技術スタック

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT 

To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

## Deploy
```bash
# artifact registry の作成
gcloud artifacts repositories create rectropic-server \
    --repository-format=docker \
    --location=asia-east1 \
    --description="Frontend Docker images"

# artifact registry の認証
gcloud auth configure-docker asia-east1-docker.pkg.dev

# ビルド
docker buildx build -t asia-east1-docker.pkg.dev/frash-447004/rectropic-server/rectropic-server:latest --platform linux/amd64 .

# プッシュ
docker push asia-east1-docker.pkg.dev/frash-447004/rectropic-server/rectropic-server:latest


gcloud run deploy rectropic-server --image asia-east1-docker.pkg.dev/frash-447004/rectropic-server/rectropic-server:latest --platform managed --set-env-vars NODE_ENV=production --region=asia-east1

gcloud run services update-traffic rectropic-server --to-latest --region=asia-east1

gcloud artifacts repositories delete rectropic-server --location=asia-east1
```

## No Left Space
```bash
docker system df

docker system prune -a

docker system prune --volumes
```

## Cloud SQL Proxy
```
./cloud-sql-proxy frash-447004:asia-northeast1:frash-db
```

open http://localhost:3000

