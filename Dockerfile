# Cloud Run用 Dockerfile
FROM node:18-alpine

# 作業ディレクトリ設定
WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install --only=production

# アプリケーションコードをコピー
COPY . .

# ポート設定（Cloud Runはデフォルト8080）
EXPOSE 8080

# アプリケーション起動
CMD ["npm", "start"]