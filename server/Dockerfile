# ベースイメージを指定
FROM oven/bun AS build

WORKDIR /app

COPY package*.json ./
RUN bun install

# アプリケーションのソースコードをコピー
COPY . .

EXPOSE 8080

# シークレットはイメージに埋め込まない。実行時に注入する:
#   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN (Turso クラウド時), JWT_SECRET, PORT
# ローカル例: docker run -e TURSO_DATABASE_URL=file:local.db …
# 本番例: Cloud Run の環境変数 / Secret Manager
# 参照: server/.env.example, docs/SECURITY_TURSO_SECRETS_REMEDIATION.md

# アプリケーションを起動
CMD ["bun", "run", "start"]
