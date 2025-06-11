# AI Language Converter

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![Platform](https://img.shields.io/badge/platform-Google%20Cloud%20Run-blue.svg)

AIを活用した日本語表現変換ツール。Claude、Gemini、ChatGPTの3つのAIエンジンに対応し、関西弁、敬語、カジュアル調など様々なスタイルへの自動変換を提供します。
構築方法含めて、全て生成AIの指示の元作っているため、責任は終えません。

## 🌟 特徴

- **マルチAI対応**: Claude、Gemini、ChatGPTの3つのAIエンジンをサポート
- **豊富な変換スタイル**: 関西弁、敬語、カジュアル、ビジネス調、要約など多数のプリセット
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **高速処理**: 最適化されたAPI呼び出しとキャッシュ機能
- **セキュリティ**: レート制限、入力検証、セキュリティヘッダー完備
- **クラウドネイティブ**: Google Cloud Run対応のコンテナ化アプリケーション

## 🚀 デモ

[ライブデモ（Gemini単体）](https://storage.googleapis.com/hougen/index.html)

## 📋 目次

- [インストール](#インストール)
- [環境設定](#環境設定)
- [使用方法](#使用方法)
- [API仕様](#api仕様)
- [デプロイ](#デプロイ)
- [開発](#開発)
- [ファイル構成](#ファイル構成)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

## 🛠️ インストール

### 前提条件

- Node.js 18以上
- npm または yarn
- Git

### ローカル環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-username/hougen-converter.git
cd hougen-converter

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してAPIキーを設定

# 開発サーバーの起動
npm run dev
```

## ⚙️ 環境設定

### 必要な環境変数

```bash
# 少なくとも1つのAPIキーが必要
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# オプション設定
PORT=8080
NODE_ENV=production
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GEMINI_MODEL=gemma-2-27b-it
OPENAI_MODEL=gpt-4o
```

### APIキーの取得方法

#### Claude API
1. [Anthropic Console](https://console.anthropic.com/)にサインアップ
2. APIキーを生成
3. `CLAUDE_API_KEY`に設定

#### Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを生成
2. `GEMINI_API_KEY`に設定

#### OpenAI API
1. [OpenAI Platform](https://platform.openai.com/api-keys)でAPIキーを生成
2. `OPENAI_API_KEY`に設定

## 🎯 使用方法

### Webインターフェース

1. ブラウザでアプリケーションにアクセス
2. 使用したいAIエンジンを選択（Claude/Gemini/ChatGPT）
3. 変換したいテキストを入力
4. 変換スタイルを選択またはカスタム入力
5. 「変換開始」ボタンをクリック
6. 結果をコピーまたは共有

### プリセット変換スタイル

- **関西弁**: 親しみやすい関西弁に変換
- **敬語**: ビジネス向け丁寧語に変換
- **カジュアル**: 友達同士の会話調に変換
- **ビジネス調**: フォーマルなビジネス文書に変換
- **子供向け**: 子供にも分かりやすい表現に変換
- **英語風**: 英語的な表現に変換
- **要約**: 簡潔な要約に変換
- **箇条書き**: 分かりやすい箇条書きに変換

### カスタム変換

自由な変換指示も可能です：
- "3歳児でも分かるように"
- "Shakespeare風に"
- "怒った感じで"
- "博多弁で"

## 📡 API仕様

### エンドポイント

#### ヘルスチェック
```http
GET /health
```

#### Claude変換
```http
POST /convertText
Content-Type: application/json

{
  "content": "変換したいテキスト",
  "method": "関西弁"
}
```

#### Gemini変換
```http
POST /convertTextGemini
Content-Type: application/json

{
  "content": "変換したいテキスト",
  "method": "敬語"
}
```

#### ChatGPT変換
```http
POST /convertTextChatGPT
Content-Type: application/json

{
  "content": "変換したいテキスト", 
  "method": "カジュアル"
}
```

### レスポンス形式

#### 成功時
```json
{
  "success": true,
  "convertedText": "変換された文章",
  "info": {
    "method": "関西弁",
    "methodType": "preset",
    "originalLength": 50,
    "convertedLength": 48,
    "processingTime": "1200ms",
    "modelUsed": "claude-3-5-sonnet-20241022",
    "apiProvider": "Claude"
  },
  "usage": {
    "limit": "20回/時間",
    "remaining": 18
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ",
  "details": {
    "modelUsed": "claude-3-5-sonnet-20241022",
    "apiProvider": "Claude",
    "processingTime": "500ms"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 制限事項

- **レート制限**: 1時間あたり20リクエスト
- **文字数制限**: 最大1000文字
- **変換方式**: 最大100文字

## 🚢 デプロイ

### Google Cloud Run

```bash
# Dockerイメージをビルド
docker build -t hougen-converter .

# Google Cloud Runにデプロイ
gcloud run deploy hougen-converter \
  --image hougen-converter \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="CLAUDE_API_KEY=your_key,GEMINI_API_KEY=your_key"
```


## 🔧 開発

### 開発環境の起動

```bash
# 開発モードで起動（ホットリロード有効）
npm run dev

# 本番モードで起動
npm start

# lintチェック
npm run lint
```

### フロントエンド開発

フロントエンドは純粋なHTML/CSS/JavaScriptで構築されており、以下の特徴があります：

- **モジュラー設計**: 機能ごとにファイル分割
- **レスポンシブデザイン**: CSS Grid/Flexboxを活用
- **アクセシビリティ**: ARIA属性とキーボードナビゲーション対応
- **パフォーマンス**: 最適化されたアニメーションと遅延読み込み

### バックエンド開発

Node.js/Expressベースのバックエンドの特徴：

- **RESTful API**: 標準的なHTTP仕様に準拠
- **セキュリティ**: Helmet.js、レート制限、入力検証
- **エラーハンドリング**: 包括的なエラー処理とログ記録
- **モニタリング**: ヘルスチェックとメトリクス収集

## 📁 ファイル構成

```
hougen-converter/
├── frontend/
│   ├── index.html             # Gemini専用
│   ├── multiLLM.html          # マルチLLM対応版
│   ├── styles.css             # 統合スタイルシート
│   └── js/
│       ├── constants.js       # アプリケーション定数
│       ├── config.js          # 設定管理
│       ├── api.js             # APIクライアント
│       ├── app.js             # メインアプリケーション
│       └── ui.js              # UI制御クラス
├── backend/
│   ├── server.js              # メインサーバー
│   ├── config/
│   │   └── index.js           # 設定管理
│   ├── routes/
│   │   ├── health.js          # ヘルスチェック
│   │   └── convert.js         # 変換エンドポイント
│   ├── services/
│   │   ├── claude.js          # Claude APIサービス
│   │   ├── gemini.js          # Gemini APIサービス
│   │   └── openai.js          # OpenAI APIサービス
│   ├── middleware/
│   │   └── index.js           # ミドルウェア設定
│   ├── utils/
│   │   ├── validation.js      # バリデーション
│   │   └── rateLimit.js       # レート制限
│   └── prompts/
│       └── index.js           # プロンプト管理
├── Dockerfile                 # Docker設定
├── package.json               # 依存関係
└── README.md                  # このファイル
```

## 🛡️ セキュリティ

### 実装されているセキュリティ対策

- **HTTPS強制**: 本番環境では必須
- **セキュリティヘッダー**: Helmet.jsによる包括的な保護
- **レート制限**: IP別の利用回数制限
- **入力検証**: XSS、SQLインジェクション対策
- **CORS設定**: 適切なオリジン制限
- **APIキー保護**: 環境変数による機密情報管理

### セキュリティのベストプラクティス

1. APIキーは絶対にコードにハードコーディングしない
2. 定期的な依存関係の更新
3. ログに機密情報を出力しない
4. 適切なエラーハンドリングで情報漏洩を防ぐ

## 🧪 テスト

```bash
# ユニットテストの実行（実装予定）
npm test

# APIテストの実行（実装予定）
npm run test:api

# カバレッジレポートの生成（実装予定）
npm run test:coverage
```

## 📈 パフォーマンス

### 最適化項目

- **レスポンス時間**: 平均1.5秒以下
- **メモリ使用量**: 512MB以下で安定動作
- **同時接続**: 100接続まで対応
- **キャッシュ**: レスポンスとレート制限のメモリキャッシュ

### 監視とメトリクス

- **ヘルスチェック**: `/health`エンドポイント
- **ログ記録**: 構造化されたJSONログ
- **エラー追跡**: 詳細なスタックトレース

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

### 貢献の流れ

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- **コードスタイル**: ESLintとPrettierの設定に従う
- **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/)に準拠
- **テスト**: 新機能には適切なテストを追加
- **ドキュメント**: READMEとコメントの更新

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/takaoohtsubo/hougen-converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/takaoohtsubo/hougen-converter/discussions)
- **Email**: support@example.com

## 🔄 更新履歴

### v0.1.0 (2025-06-11)
- 初回リリース
- Claude、Gemini、ChatGPT対応
- レスポンシブWebデザイン実装
- Google Cloud Run対応

## 📝 ライセンス

このプロジェクトは[ISC License](LICENSE)の下で公開されています。

## 🙏 謝辞

- [Anthropic](https://www.anthropic.com/) - Claude API
- [Google](https://developers.generativeai.google/) - Gemini API  
- [OpenAI](https://openai.com/) - ChatGPT API
- [Express.js](https://expressjs.com/) - Web framework
- [Google Cloud Run](https://cloud.google.com/run) - Hosting platform

---

**Made with ❤️ for the AI community**

[![Deploy to Cloud Run](https://img.shields.io/badge/Deploy%20to-Cloud%20Run-blue.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/takaoohtsubo/hougen-converter)
[![Try it now](https://img.shields.io/badge/Try-Live%20Demo-green.svg)](https://storage.googleapis.com/hougen/index.html)