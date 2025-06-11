// server.js - メインサーバーファイル
const express = require('express');
const config = require('./config');
const { 
    setupMiddleware, 
    notFoundHandler, 
    globalErrorHandler, 
    setupGracefulShutdown 
} = require('./middleware');

// ルートのインポート
const healthRoutes = require('./routes/health');
const convertRoutes = require('./routes/convert');

// Express アプリケーションの初期化
const app = express();

/**
 * ミドルウェアの設定
 */
setupMiddleware(app);

/**
 * ルートの設定
 */
// ヘルスチェック
app.use('/', healthRoutes);

// 変換API
app.use('/', convertRoutes);

// 基本情報エンドポイント（オプション）
app.get('/', (req, res) => {
    res.json({
        name: 'Text Conversion API',
        version: '1.0.0',
        description: 'Claude & Gemini & ChatGPT を使用したテキスト変換サービス',
        endpoints: {
            health: 'GET /health',
            claude: 'POST /convertText',
            gemini: 'POST /convertTextGemini',
            chatgpt: 'POST /convertTextChatGPT'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * エラーハンドラーの設定
 */
// 404ハンドラー
app.use('*', notFoundHandler);

// グローバルエラーハンドラー
app.use(globalErrorHandler);

/**
 * サーバー起動
 */
function startServer() {
    try {
        // 設定の検証
        validateConfiguration();
        
        // グレースフルシャットダウンの設定
        setupGracefulShutdown();
        
        // サーバー起動
        const server = app.listen(config.server.port, () => {
            console.log('🚀 Server startup completed');
            console.log(`📡 Port: ${config.server.port}`);
            console.log(`🌍 Environment: ${config.server.environment}`);
            console.log(`🤖 Claude API: ${config.apis.claude.apiKey ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`🤖 Gemini API: ${config.apis.gemini.apiKey ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`🤖 ChatGPT API: ${config.apis.openai.apiKey ? '✅ Configured' : '❌ Not configured'}`);
            console.log(`📊 Rate Limit: ${config.limits.maxRequestsPerHour} requests/hour`);
            console.log(`📝 Max Content Length: ${config.limits.maxContentLength} characters`);
            console.log(`🔒 Security: Enhanced headers enabled`);
            console.log('');
            console.log('Available endpoints:');
            console.log(`  GET  /health - Health check`);
            console.log(`  POST /convertText - Claude conversion`);
            console.log(`  POST /convertTextGemini - Gemini conversion`);
            console.log(`  POST /convertTextChatGPT - ChatGPT conversion`);
            console.log('');
            console.log('🎯 Server ready to accept requests');
        });

        // サーバーエラーハンドリング
        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });

        return server;

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

/**
 * 設定の検証
 */
function validateConfiguration() {
    const requiredEnvVars = [];
    
    // 最低限1つのAPIキーは必要
    if (!config.apis.claude.apiKey && !config.apis.gemini.apiKey && !config.apis.openai.apiKey) {
        requiredEnvVars.push('CLAUDE_API_KEY または GEMINI_API_KEY または OPENAI_API_KEY');
    }
    
    if (requiredEnvVars.length > 0) {
        throw new Error(`Required environment variables missing: ${requiredEnvVars.join(', ')}`);
    }
    
    // 設定値の妥当性チェック
    if (config.server.port < 1 || config.server.port > 65535) {
        throw new Error('Invalid port number');
    }
    
    if (config.limits.maxRequestsPerHour < 1) {
        throw new Error('Invalid rate limit configuration');
    }
    
    console.log('✅ Configuration validation passed');
}

/**
 * 開発環境でのみサーバーを起動
 * (テスト環境では手動で制御)
 */
if (require.main === module) {
    startServer();
}

module.exports = app;