// utils/validation.js - バリデーション
const crypto = require('crypto');
const config = require('../config');

/**
 * 入力内容のバリデーションとサニタイゼ
 */
function validateAndSanitize(content, method, clientIp) {
    if (!content || !method) {
        throw new Error('変換内容と変換方式は必須です');
    }
    
    if (content.length > config.limits.maxContentLength) {
        throw new Error('文書は1000文字以内にしてください');
    }
    
    if (method.length > config.limits.maxMethodLength) {
        throw new Error('変換方式は100文字以内にしてください');
    }
    
    if (!content.trim() || !method.trim()) {
        throw new Error('変換内容と変換方式に有効な文字を入力してください');
    }
    
    const combinedInput = content + ' ' + method;
    for (const pattern of config.dangerousPatterns) {
        if (pattern.test(combinedInput)) {
            throw new Error('不適切な入力が検出されました');
        }
    }
    
    const clientId = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 12);
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    const cleanMethod = method.replace(/<[^>]*>/g, '').trim();
    const normalizedMethod = normalizeMethod(cleanMethod);
    
    return { cleanContent, normalizedMethod, clientId };
}

/**
 * 変換方式の正規化
 */
function normalizeMethod(method) {
    let normalized = method.trim();
    
    const exactMatch = config.presetMethods.find(preset => 
        preset.toLowerCase() === normalized.toLowerCase()
    );
    
    if (exactMatch) {
        return exactMatch;
    }
    
    const partialMatch = config.presetMethods.find(preset => 
        preset.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(preset.toLowerCase())
    );
    
    if (partialMatch && normalized.length >= 2) {
        return partialMatch;
    }
    
    return normalized.substring(0, 50);
}

/**
 * クライアントIPアドレスの取得
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           'unknown';
}

module.exports = {
    validateAndSanitize,
    normalizeMethod,
    getClientIp
};