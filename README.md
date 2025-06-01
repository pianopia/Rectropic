# Rectropic

TikTokのような縦型でフリックできる画像や動画形式を、リスト化して友達に共有できるサービスです。

## アプリケーション概要

Rectropicは、TikTokやYoutubeショートの動画をURLからリストに追加でき、友達からの反応をもらうことができるアプリです。また、自分で作成した画像や動画をリストに追加することもできます。リストは複数作ることができ、リストごとに招待する友達を追加・変更できます。

### ユースケース

- カップルがデート場所を共有する際に、候補リストを作成してロケーションの動画や画像を共有してお互いの良いと思った場所にいいねを押していく
- 友達と遊ぶ場所候補リストを作成して、縦型ルーレットで次の行く場所を決める
- 雑談の中で、自分が行って楽しかった場所をリスト化したものをQRコードで共有する

## プロジェクト構成

```
Rectropic/
├── server/          # バックエンドAPI (Hono + Bun)
├── native/          # ネイティブアプリ (React Native + Expo)
└── README.md        # このファイル
```

## 技術スタック

### バックエンド
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT

### ネイティブアプリ
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State Management**: React Context
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd Rectropic
```

### 2. バックエンドのセットアップ

```bash
cd server
bun install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定

# データベースマイグレーション
bun run drizzle-kit generate:pg
bun run drizzle-kit push:pg

# サーバー起動
bun run dev
```

### 3. ネイティブアプリのセットアップ

```bash
cd native
npm install

# アプリ起動
npm run ios     # iOS
npm run android # Android
npm run web     # Web
```

## 機能一覧

### 認証
- Googleログイン
- Appleログイン
- JWT認証

### リスト管理
- リスト作成・編集・削除
- メンバー招待・管理
- 公開/非公開設定

### コンテンツ管理
- 画像・動画・URLの追加
- TikTok/YouTubeショートのURL対応
- 縦型スワイプ表示

### リアクション
- いいね・ラブ・ディスライク
- リアクション統計

### プレミアム機能
- 無制限のリスト作成
- 無制限のコンテンツ追加
- 優先サポート

## マネタイズ

- 無料プランでは10個のリストとリスト内の項目も10個まで
- 有料プランにすることで、無制限にリストとリスト内のコンテンツも増やせる

## 開発状況

- ✅ バックエンドAPI基盤
- ✅ 認証システム
- ✅ リスト管理機能
- ✅ コンテンツ管理機能
- ✅ ネイティブアプリ基盤
- ✅ 基本画面実装
- 🚧 実際のソーシャルログイン実装
- 🚧 決済システム統合
- 🚧 プッシュ通知
- 🚧 QRコード共有機能

## ライセンス

MIT License