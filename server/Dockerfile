# ベースイメージを指定
FROM oven/bun AS build

WORKDIR /app

COPY package*.json ./
RUN bun install

# アプリケーションのソースコードをコピー
COPY . .

EXPOSE 8080
EXPOSE 5432

# アプリケーションを起動
CMD ["bun", "run", "start"]