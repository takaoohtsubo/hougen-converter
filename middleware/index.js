// middleware/index.js - ミドルウェア設定
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('../config');

/**
 * 基本ミドルウェアの設定
 */
function setupMiddleware(app) {
    // セキュリティヘッダーの設定
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    // CORS設定
    app.use(cors(config.cors));

    // gzip圧縮
    app.use(compression());

    // JSONパース設定
    app.use(express.json({ 
        limit: '10mb',
        strict: true
    }));

    // URLエンコード設定
    app.use(express.urlencoded({ 
        extended: true,
        limit: '10mb'
    }));

    // リクエストログミドルウェア
    app.use(requestLogger);

    // レスポンスヘッダー設定
    app.use(setResponseHeaders);
}

/**
 * リクエストログミドルウェア
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    'unknown';

    // リクエスト開始ログ
    console.log(`${timestamp} ${req.method} ${req.path} - Client: ${clientIp}`);

    // レスポンス完了時のログ
    res.on('finish', () => {
        const processingTime = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
        
        console.log(`${new Date().toISOString()} [${logLevel}] ${req.method} ${req.path} - Status: ${res.statusCode} - Time: ${processingTime}ms - Client: ${clientIp}`);
    });

    next();
}

/**
 * レスポンスヘッダー設定
 */
function setResponseHeaders(req, res, next) {
    // キャッシュ制御
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // APIバージョン
    res.set('X-API-Version', '1.0.0');

    // レート制限情報（後でrateLimit.jsで上書きされる）
    res.set('X-RateLimit-Limit', config.limits.maxRequestsPerHour.toString());

    next();
}

/**
 * 404ハンドラー
 */
function notFoundHandler(req, res) {
    const timestamp = new Date().toISOString();
    
    console.log(`${timestamp} [WARN] 404 Not Found: ${req.method} ${req.originalUrl}`);
    
    res.status(404).json({
        error: 'エンドポイントが見つかりません',
        path: req.originalUrl,
        method: req.method,
        timestamp: timestamp,
        availableEndpoints: {
            health: 'GET /health',
            claude: 'POST /convertText',
            gemini: 'POST /convertTextGemini',
            chatgpt: 'POST /convertTextChatGPT'
        }
    });
}

/**
 * グローバルエラーハンドラー
 */
function globalErrorHandler(error, req, res, next) {
    const timestamp = new Date().toISOString();
    const errorId = Math.random().toString(36).substr(2, 9);
    
    // エラーログ出力
    console.error(`${timestamp} [ERROR] ${errorId} Unhandled error:`, {
        message: error.message,
        stack: error.stack,
        path: req.originalUrl,
        method: req.method,
        body: req.body,
        headers: req.headers
    });

    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = config.server.environment === 'development';
    
    res.status(500).json({
        error: 'サーバーエラーが発生しました',
        errorId: errorId,
        timestamp: timestamp,
        ...(isDevelopment && {
            details: {
                message: error.message,
                stack: error.stack
            }
        })
    });
}

/**
 * グレースフルシャットダウンの設定
 */
function setupGracefulShutdown() {
    // プロセス終了シグナルの処理
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
        process.on(signal, () => {
            console.log(`\n${new Date().toISOString()} [INFO] Received ${signal}, starting graceful shutdown...`);
            
            // アクティブな接続の処理完了を待つ
            setTimeout(() => {
                console.log(`${new Date().toISOString()} [INFO] Graceful shutdown completed`);
                process.exit(0);
            }, 5000); // 5秒間の猶予
        });
    });

    // 未処理のPromise拒否
    process.on('unhandledRejection', (reason, promise) => {
        console.error(`${new Date().toISOString()} [ERROR] Unhandled Rejection at:`, promise, 'reason:', reason);
        // プロダクション環境では終了させる
        if (config.server.environment === 'production') {
            process.exit(1);
        }
    });

    // 未処理の例外
    process.on('uncaughtException', (error) => {
        console.error(`${new Date().toISOString()} [ERROR] Uncaught Exception:`, error);
        process.exit(1);
    });

    console.log('✅ Graceful shutdown handlers configured');
}

/**
 * ヘルスチェック用ミドルウェア
 */
function healthCheckMiddleware(req, res, next) {
    // ヘルスチェックエンドポイントの場合は詳細ログを省略
    if (req.path === '/health') {
        req.skipDetailedLogging = true;
    }
    next();
}

/**
 * セキュリティミドルウェア（追加の保護）
 */
function securityMiddleware(req, res, next) {
    // 大きなペイロードの拒否
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 10 * 1024 * 1024) {
        return res.status(413).json({
            error: 'ペイロードが大きすぎます',
            maxSize: '10MB',
            timestamp: new Date().toISOString()
        });
    }

    // 疑わしいUser-Agentのチェック
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousPatterns = [
        /bot|crawler|spider/i,
        /scanner|nikto|sqlmap/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        console.log(`${new Date().toISOString()} [WARN] Suspicious User-Agent detected: ${userAgent} from ${req.ip}`);
    }

    next();
}

module.exports = {
    setupMiddleware,
    requestLogger,
    setResponseHeaders,
    notFoundHandler,
    globalErrorHandler,
    setupGracefulShutdown,
    healthCheckMiddleware,
    securityMiddleware
};