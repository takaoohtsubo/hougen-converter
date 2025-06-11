// routes/health.js - ヘルスチェック
const express = require('express');
const config = require('../config');

const router = express.Router();

/**
 * ヘルスチェックエンドポイント
 */
router.get('/health', (req, res) => {
    try {
        const healthData = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: config.server.environment,
            apis: {
                claude: {
                    configured: !!config.apis.claude.apiKey,
                    model: config.apis.claude.model
                },
                gemini: {
                    configured: !!config.apis.gemini.apiKey,
                    model: config.apis.gemini.model
                },
                openai: {
                    configured: !!config.apis.openai.apiKey,
                    model: config.apis.openai.model
                }
            },
            version: '1.0.0',
            platform: 'Google Cloud Run',
            uptime: process.uptime()
        };

        console.log('Health check completed successfully');
        res.status(200).json(healthData);

    } catch (error) {
        console.error(`Health check failed: ${error.message}`);
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;