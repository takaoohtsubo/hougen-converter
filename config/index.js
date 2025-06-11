// config/index.js - 設定管理
module.exports = {
    // サーバー設定
    server: {
        port: process.env.PORT || 8080,
        environment: process.env.NODE_ENV || 'production'
    },

    // API設定
    apis: {
        claude: {
            apiKey: process.env.CLAUDE_API_KEY,
            model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
            version: '2023-06-01',
            baseUrl: 'https://api.anthropic.com/v1/messages'
        },
        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemma-2-27b-it',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            baseUrl: 'https://api.openai.com/v1/chat/completions'
        }
    },

    // 制限値
    limits: {
        maxRequestsPerHour: 20,
        maxContentLength: 1000,
        maxMethodLength: 100,
        cacheCleanupInterval: 60 * 60 * 1000 // 1時間
    },

    // プリセット変換方式
    presetMethods: [
        '関西弁', '博多弁', '津軽弁', '沖縄弁', '敬語', 
        '英語', '要約', '箇条書き', 'カジュアル', 'フォーマル'
    ],

    // セキュリティパターン
    dangerousPatterns: [
        /<script|javascript:|on\w+=/i,
        /\b(eval|function|constructor)\s*\(/i,
        /\b(document|window|global)\./i,
        /(union|select|insert|delete|drop|create|alter)\s+/i
    ],

    // CORS設定
    cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept']
    }
};