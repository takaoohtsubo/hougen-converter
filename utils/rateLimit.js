// utils/rateLimit.js - レート制限
const config = require('../config');

// レート制限キャッシュ
const rateLimitCache = new Map();
let lastCleanup = Date.now();

/**
 * レート制限チェック
 */
function checkRateLimit(clientId) {
    const now = Date.now();
    
    // 定期的なキャッシュクリーンアップ
    if (now - lastCleanup > config.limits.cacheCleanupInterval) {
        rateLimitCache.clear();
        lastCleanup = now;
    }
    
    if (!rateLimitCache.has(clientId)) {
        rateLimitCache.set(clientId, {
            count: 0,
            windowStart: now
        });
    }
    
    const clientData = rateLimitCache.get(clientId);
    
    // ウィンドウのリセット
    if (now - clientData.windowStart > config.limits.cacheCleanupInterval) {
        clientData.count = 0;
        clientData.windowStart = now;
    }
    
    // 制限チェック
    if (clientData.count >= config.limits.maxRequestsPerHour) {
        throw new Error(`1時間の利用制限（${config.limits.maxRequestsPerHour}回）に達しました。しばらく時間をおいてから再試行してください`);
    }
    
    clientData.count++;
    return clientData.count;
}

/**
 * 残り利用回数の取得
 */
function getRemainingRequests(clientId) {
    const clientData = rateLimitCache.get(clientId);
    if (!clientData) return config.limits.maxRequestsPerHour;
    
    return Math.max(0, config.limits.maxRequestsPerHour - clientData.count);
}

module.exports = {
    checkRateLimit,
    getRemainingRequests
};