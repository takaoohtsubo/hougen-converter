// routes/convert.js - 変換ルート
const express = require('express');
const config = require('../config');
const { validateAndSanitize, getClientIp } = require('../utils/validation');
const { checkRateLimit, getRemainingRequests } = require('../utils/rateLimit');
const { callClaudeAPI } = require('../services/claude');
const { callGeminiAPI } = require('../services/gemini');
const { callOpenAIAPI } = require('../services/openai');

const router = express.Router();

/**
 * 変換結果の共通レスポンス構築
 */
function buildSuccessResponse(result, normalizedMethod, cleanContent, processingTime, modelUsed, apiProvider, clientId) {
    return {
        success: true,
        convertedText: result,
        info: {
            method: normalizedMethod,
            methodType: config.presetMethods.includes(normalizedMethod) ? 'preset' : 'custom',
            originalLength: cleanContent.length,
            convertedLength: result.length,
            processingTime: `${processingTime}ms`,
            modelUsed: modelUsed,
            apiProvider: apiProvider
        },
        usage: {
            limit: `${config.limits.maxRequestsPerHour}回/時間`,
            remaining: getRemainingRequests(clientId)
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * エラーレスポンスの構築
 */
function buildErrorResponse(error, processingTime, modelUsed, apiProvider) {
    const clientErrorPatterns = [
        '利用制限', '必須', '文字以内', 'APIキー', '不適切な入力',
        '403エラー', '401エラー', '429エラー', '400エラー', 'タイムアウト'
    ];
    
    const isClientError = clientErrorPatterns.some(pattern => 
        error.message.includes(pattern)
    );
    
    return {
        status: isClientError ? 400 : 500,
        response: {
            error: isClientError ? error.message : 'サーバーエラーが発生しました',
            details: {
                modelUsed: modelUsed,
                apiProvider: apiProvider,
                processingTime: `${processingTime}ms`
            },
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * Claude用テキスト変換エンドポイント
 */
router.post('/convertText', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { content, method } = req.body;
        const clientIp = getClientIp(req);
        
        console.log(`Claude変換開始 - 方式: ${method}, クライアント: ${clientIp}`);
        
        const { cleanContent, normalizedMethod, clientId } = validateAndSanitize(
            content, method, clientIp
        );
        
        checkRateLimit(clientId);
        const result = await callClaudeAPI(cleanContent, normalizedMethod);
        
        const processingTime = Date.now() - startTime;
        console.log(`Claude変換成功 - 処理時間: ${processingTime}ms`);
        
        const response = buildSuccessResponse(
            result, normalizedMethod, cleanContent, processingTime,
            config.apis.claude.model, 'Claude', clientId
        );
        
        res.status(200).json(response);

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`Claude変換エラー: ${error.message} (処理時間: ${processingTime}ms)`);
        
        const { status, response } = buildErrorResponse(
            error, processingTime, config.apis.claude.model, 'Claude'
        );
        
        res.status(status).json(response);
    }
});

/**
 * Gemini用テキスト変換エンドポイント
 */
router.post('/convertTextGemini', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { content, method } = req.body;
        const clientIp = getClientIp(req);
        
        console.log(`Gemini変換開始 - 方式: ${method}, クライアント: ${clientIp}`);
        
        const { cleanContent, normalizedMethod, clientId } = validateAndSanitize(
            content, method, clientIp
        );
        
        checkRateLimit(clientId);
        const result = await callGeminiAPI(cleanContent, normalizedMethod);
        
        const processingTime = Date.now() - startTime;
        console.log(`Gemini変換成功 - 処理時間: ${processingTime}ms`);
        
        const response = buildSuccessResponse(
            result, normalizedMethod, cleanContent, processingTime,
            config.apis.gemini.model, 'Gemini', clientId
        );
        
        res.status(200).json(response);

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`Gemini変換エラー: ${error.message} (処理時間: ${processingTime}ms)`);
        
        const { status, response } = buildErrorResponse(
            error, processingTime, config.apis.gemini.model, 'Gemini'
        );
        
        res.status(status).json(response);
    }
});

/**
 * ChatGPT用テキスト変換エンドポイント
 */
router.post('/convertTextChatGPT', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { content, method } = req.body;
        const clientIp = getClientIp(req);
        
        console.log(`ChatGPT変換開始 - 方式: ${method}, クライアント: ${clientIp}`);
        
        const { cleanContent, normalizedMethod, clientId } = validateAndSanitize(
            content, method, clientIp
        );
        
        checkRateLimit(clientId);
        const result = await callOpenAIAPI(cleanContent, normalizedMethod);
        
        const processingTime = Date.now() - startTime;
        console.log(`ChatGPT変換成功 - 処理時間: ${processingTime}ms`);
        
        const response = buildSuccessResponse(
            result, normalizedMethod, cleanContent, processingTime,
            config.apis.openai.model, 'ChatGPT', clientId
        );
        
        res.status(200).json(response);

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`ChatGPT変換エラー: ${error.message} (処理時間: ${processingTime}ms)`);
        
        const { status, response } = buildErrorResponse(
            error, processingTime, config.apis.openai.model, 'ChatGPT'
        );
        
        res.status(status).json(response);
    }
});

module.exports = router;