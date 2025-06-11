// api.js - API クライアント（constants.js・config.js依存）
// constants.js と config.js の読み込み完了後に実行される

(function() {
    'use strict';
    
    // 依存関係の読み込み完了を待機
    function waitForDependencies() {
        return new Promise((resolve) => {
            let constantsLoaded = false;
            let configLoaded = false;
            
            function checkReady() {
                if (constantsLoaded && configLoaded) {
                    resolve();
                }
            }
            
            // constants.js の読み込み確認
            if (typeof window.APP_CONSTANTS !== 'undefined') {
                constantsLoaded = true;
            } else {
                window.addEventListener('constants-loaded', () => {
                    constantsLoaded = true;
                    checkReady();
                }, { once: true });
            }
            
            // config.js の読み込み確認
            if (typeof window.getSelectedAPI !== 'undefined') {
                configLoaded = true;
            } else {
                window.addEventListener('config-loaded', () => {
                    configLoaded = true;
                    checkReady();
                }, { once: true });
            }
            
            checkReady();
        });
    }
    
    // API初期化
    async function initializeAPI() {
        await waitForDependencies();
        
        const constants = window.APP_CONSTANTS;
        const logger = window.logger;
        
        /**
         * 定数の安全な取得
         */
        function getApiConstants() {
            if (typeof constants === 'undefined') {
                console.error('Constants not loaded. Make sure constants.js is loaded first.');
                return {
                    API_CONFIG: {},
                    MESSAGES: {},
                    DEBUG: { ENABLED: false }
                };
            }
            return {
                API_CONFIG: constants.API_CONFIG || {},
                MESSAGES: constants.MESSAGES || {},
                DEBUG: constants.DEBUG || { ENABLED: false }
            };
        }
        
        /**
         * APIクライアントクラス
         */
        class APIClient {
            constructor() {
                const apiConstants = getApiConstants();
                this.baseURL = apiConstants.API_CONFIG.BASE_URL || '';
                this.timeout = apiConstants.API_CONFIG.TIMEOUT || 30000;
                this.retryCount = apiConstants.API_CONFIG.RETRY_COUNT || 3;
                
                if (apiConstants.DEBUG.ENABLED) {
                    logger.info('APIClient initialized', {
                        baseURL: this.baseURL,
                        timeout: this.timeout,
                        retryCount: this.retryCount
                    });
                }
            }
            
            /**
             * 基本的なHTTPリクエスト
             */
            async request(endpoint, options = {}) {
                const url = this.baseURL + endpoint;
                
                logger.info(`API Request: ${options.method || 'GET'} ${url}`);
                
                const defaultOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'omit',
                    mode: 'cors'
                };
                
                const finalOptions = { ...defaultOptions, ...options };
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                    
                    const response = await fetch(url, {
                        ...finalOptions,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    logger.info(`API Response: ${response.status} ${response.statusText}`);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        logger.error(`API Error: ${endpoint}`, { 
                            status: response.status, 
                            error: errorText 
                        });
                        
                        // ステータスコードに応じたエラーメッセージ
                        const errorMessage = this.getErrorMessage(response.status, errorText);
                        throw new Error(errorMessage);
                    }
                    
                    const data = await response.json();
                    
                    if (constants.DEBUG.SHOW_API_RESPONSES) {
                        logger.debug('API Response Data:', data);
                    }
                    
                    return data;
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        logger.error(`API Timeout: ${endpoint}`);
                        throw new Error(constants.MESSAGES.ERROR.TIMEOUT);
                    }
                    
                    logger.error(`API Error: ${endpoint}`, error);
                    throw error;
                }
            }
            
            /**
             * HTTPステータスコードに応じたエラーメッセージを取得
             */
            getErrorMessage(status, errorText = '') {
                const apiConstants = getApiConstants();
                const statusCodes = apiConstants.API_CONFIG.STATUS_CODES || {};
                const messages = apiConstants.MESSAGES.ERROR || {};
                
                switch (status) {
                    case statusCodes.BAD_REQUEST || 400:
                        return messages.VALIDATION || 'Bad Request';
                    case statusCodes.UNAUTHORIZED || 401:
                        return messages.API_KEY_INVALID || 'Unauthorized';
                    case statusCodes.FORBIDDEN || 403:
                        return messages.API_PERMISSION || 'Forbidden';
                    case statusCodes.TOO_MANY_REQUESTS || 429:
                        return messages.RATE_LIMIT || 'Too Many Requests';
                    case statusCodes.INTERNAL_SERVER_ERROR || 500:
                        return messages.SERVER_ERROR || 'Server Error';
                    default:
                        return errorText || messages.UNKNOWN || 'Unknown Error';
                }
            }
            
            /**
             * ヘルスチェック
             */
            async health() {
                const apiConstants = getApiConstants();
                const endpoints = apiConstants.API_CONFIG.ENDPOINTS || {};
                return await this.request(endpoints.HEALTH || '/health');
            }
            
            /**
             * テキスト変換（API選択対応）
             */
            async convertText(content, method, apiType = null) {
                const requestData = {
                    content: content?.toString().trim(),
                    method: method?.toString().trim()
                };
                
                // API選択
                const selectedAPI = apiType || window.getSelectedAPI();
                const apiConfig = window.getSelectedAPIConfig();
                const endpoint = apiConfig.endpoint;
                
                logger.info('Convert request:', { 
                    ...requestData, 
                    api: selectedAPI,
                    endpoint: endpoint 
                });
                
                // API別の詳細ログ
                const apiMessages = constants.MESSAGES.LOADING || {};
                let loadingMessage = apiMessages.GENERAL || '変換処理中です...';
                
                switch (selectedAPI.toLowerCase()) {
                    case 'claude':
                        loadingMessage = apiMessages.CLAUDE || 'Claude APIで変換処理中です...';
                        break;
                    case 'gemini':
                        loadingMessage = apiMessages.GEMINI || 'Gemini APIで変換処理中です...';
                        break;
                    case 'chatgpt':
                        loadingMessage = apiMessages.CHATGPT || 'ChatGPT APIで変換処理中です...';
                        break;
                }
                
                logger.info(`Starting conversion with ${selectedAPI}: ${loadingMessage}`);
                
                return await this.request(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(requestData)
                });
            }
        }
        
        /**
         * リトライ機能付きAPIクライアント
         */
        class RetryableAPI {
            constructor() {
                this.client = new APIClient();
                const apiConstants = getApiConstants();
                this.maxRetries = apiConstants.API_CONFIG.RETRY_COUNT || 3;
                this.retryDelay = apiConstants.API_CONFIG.RETRY_DELAY || 1000;
            }
            
            /**
             * リトライ付きリクエスト実行
             */
            async withRetry(operation, retries = this.maxRetries) {
                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        logger.info(`API attempt ${attempt}/${retries}`);
                        const result = await operation();
                        logger.info(`API success on attempt ${attempt}`);
                        return result;
                        
                    } catch (error) {
                        logger.warn(`API attempt ${attempt} failed:`, error.message);
                        
                        if (attempt === retries) {
                            logger.error('All API attempts failed');
                            throw error;
                        }
                        
                        // 一時的なエラーかどうかを判定
                        const isRetryable = this.isRetryableError(error);
                        if (!isRetryable) {
                            logger.error('Non-retryable error, stopping retries');
                            throw error;
                        }
                        
                        // リトライ前の待機
                        await this.delay(this.retryDelay * attempt);
                    }
                }
            }
            
            /**
             * リトライ可能なエラーかどうかを判定
             */
            isRetryableError(error) {
                const apiConstants = getApiConstants();
                const messages = apiConstants.MESSAGES.ERROR || {};
                
                const retryableMessages = [
                    'timeout', 'network', 'fetch', 'aborted',
                    'failed to fetch', 'load failed',
                    messages.TIMEOUT || 'timeout',
                    messages.NETWORK || 'network'
                ];
                
                const errorMessage = error.message.toLowerCase();
                const isRetryable = retryableMessages.some(msg => 
                    errorMessage.includes(msg.toLowerCase())
                );
                
                // 特定のAPIエラーは再試行しない（401、403など）
                const nonRetryablePatterns = [
                    '401エラー', '403エラー', 'api key', 'unauthorized', 
                    'forbidden', 'invalid', '400エラー', 'bad request'
                ];
                
                const isNonRetryable = nonRetryablePatterns.some(pattern =>
                    errorMessage.includes(pattern.toLowerCase())
                );
                
                if (isNonRetryable) {
                    logger.info('Non-retryable error detected:', error.message);
                    return false;
                }
                
                return isRetryable;
            }
            
            /**
             * 待機処理
             */
            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            
            /**
             * ヘルスチェック（リトライ付き）
             */
            async health() {
                return await this.withRetry(() => this.client.health());
            }
            
            /**
             * テキスト変換（リトライ付き・API選択対応）
             */
            async convertText(content, method, apiType = null) {
                return await this.withRetry(() => 
                    this.client.convertText(content, method, apiType)
                );
            }
            
            /**
             * API設定の検証
             */
            validateAPISelection(apiType) {
                if (!apiType) {
                    logger.warn('No API type specified');
                    return false;
                }
                
                const apiConstants = getApiConstants();
                const validAPIs = Object.keys(constants.API_OPTIONS || {})
                    .map(key => key.toLowerCase());
                
                if (!validAPIs.includes(apiType.toLowerCase())) {
                    logger.error(`Invalid API type: ${apiType}. Valid options: ${validAPIs.join(', ')}`);
                    return false;
                }
                
                return true;
            }
            
            /**
             * API別の設定情報を取得
             */
            getAPIInfo(apiType = null) {
                const selectedAPI = apiType || window.getSelectedAPI();
                const apiConfig = window.getSelectedAPIConfig();
                
                return {
                    api: selectedAPI,
                    name: apiConfig.name,
                    description: apiConfig.description,
                    endpoint: apiConfig.endpoint,
                    icon: apiConfig.icon
                };
            }
        }
        
        // グローバルAPIインスタンス
        const api = new RetryableAPI();
        
        // グローバルに公開
        window.api = api;
        window.APIClient = APIClient;
        window.RetryableAPI = RetryableAPI;
        
        // 初期化ログ
        logger.info('API Client initialized with base URL:', api.client.baseURL);
        logger.info('Supported APIs:', Object.keys(constants.API_OPTIONS || {}));
        
        // 初期化完了イベント
        window.dispatchEvent(new CustomEvent('api-loaded', {
            detail: {
                client: api,
                baseURL: api.client.baseURL,
                supportedAPIs: Object.keys(constants.API_OPTIONS || {})
            }
        }));
        
        return api;
    }
    
    // API初期化の実行
    initializeAPI().catch(error => {
        console.error('API initialization failed:', error);
    });
    
})();