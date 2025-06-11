// config.js - 設定管理（constants.js依存）
// constants.jsの読み込み完了後に実行される

(function() {
    'use strict';
    
    // 定数読み込み完了を待機
    function waitForConstants() {
        return new Promise((resolve) => {
            if (typeof window.APP_CONSTANTS !== 'undefined') {
                resolve();
            } else {
                window.addEventListener('constants-loaded', resolve, { once: true });
            }
        });
    }
    
    // 設定初期化
    async function initializeConfig() {
        await waitForConstants();
        
        const constants = window.APP_CONSTANTS;
        
        // デフォルトAPI設定
        let selectedAPI = 'claude';
        
        /**
         * デバッグ用ログ関数
         */
        const logger = {
            debug: (message, data = null) => {
                if (constants.DEBUG.ENABLED && constants.DEBUG.LOG_LEVEL === 'debug') {
                    console.log(`[DEBUG] ${message}`, data);
                }
            },
            info: (message, data = null) => {
                if (constants.DEBUG.ENABLED) {
                    console.log(`[INFO] ${message}`, data);
                }
            },
            warn: (message, data = null) => {
                console.warn(`[WARN] ${message}`, data);
            },
            error: (message, error = null) => {
                console.error(`[ERROR] ${message}`, error);
            }
        };
        
        /**
         * API選択機能
         */
        function setSelectedAPI(apiType) {
            const upperApiType = apiType.toUpperCase();
            
            if (constants.API_OPTIONS[upperApiType]) {
                selectedAPI = apiType.toLowerCase();
                
                try {
                    localStorage.setItem(constants.STORAGE_KEYS.SELECTED_API, selectedAPI);
                } catch (error) {
                    logger.warn('LocalStorage not available', error);
                }
                
                logger.info(`API changed to: ${selectedAPI}`);
                return true;
            }
            
            logger.warn(`Invalid API type: ${apiType}`);
            return false;
        }
        
        /**
         * 選択されたAPI取得
         */
        function getSelectedAPI() {
            try {
                // ローカルストレージから復元
                const saved = localStorage.getItem(constants.STORAGE_KEYS.SELECTED_API);
                if (saved && constants.API_OPTIONS[saved.toUpperCase()]) {
                    selectedAPI = saved;
                }
            } catch (error) {
                logger.warn('LocalStorage read failed', error);
            }
            
            return selectedAPI;
        }
        
        /**
         * 選択されたAPIの設定取得
         */
        function getSelectedAPIConfig() {
            const apiType = getSelectedAPI();
            const config = constants.API_OPTIONS[apiType.toUpperCase()];
            
            if (!config) {
                logger.error(`API config not found for: ${apiType}`);
                return constants.API_OPTIONS.CLAUDE; // フォールバック
            }
            
            return config;
        }
        
        /**
         * API設定の検証
         */
        function validateAPIConfig() {
            const apiConfig = getSelectedAPIConfig();
            
            if (!apiConfig || Object.keys(apiConfig).length === 0) {
                throw new Error(`Invalid API configuration for: ${selectedAPI}`);
            }
            
            if (!constants.API_CONFIG.BASE_URL) {
                throw new Error('API Base URL is not configured');
            }
            
            return true;
        }
        
        /**
         * 設定の初期化検証
         */
        function initializeSettings() {
            try {
                validateAPIConfig();
                
                logger.info('Configuration initialized successfully', {
                    selectedAPI: getSelectedAPI(),
                    baseURL: constants.API_CONFIG.BASE_URL,
                    timeout: constants.API_CONFIG.TIMEOUT
                });
                
                return true;
            } catch (error) {
                logger.error('Configuration initialization failed', error);
                return false;
            }
        }
        
        /**
         * 後方互換性のための設定作成
         */
        function createLegacyConfig() {
            if (typeof window !== 'undefined') {
                window.APP_CONFIG = {
                    API: {
                        BASE_URL: constants.API_CONFIG.BASE_URL,
                        ENDPOINTS: constants.API_CONFIG.ENDPOINTS,
                        TIMEOUT: constants.API_CONFIG.TIMEOUT,
                        RETRY_COUNT: constants.API_CONFIG.RETRY_COUNT
                    },
                    UI: constants.UI_LIMITS,
                    MESSAGES: constants.MESSAGES,
                    PRESET_METHODS: constants.PRESET_METHODS.map(method => 
                        typeof method === 'object' ? method.name : method
                    ),
                    API_OPTIONS: constants.API_OPTIONS
                };
                
                logger.debug('Legacy config created', window.APP_CONFIG);
            }
        }
        
        /**
         * 設定リセット機能
         */
        function resetSettings() {
            try {
                localStorage.removeItem(constants.STORAGE_KEYS.SELECTED_API);
                localStorage.removeItem(constants.STORAGE_KEYS.USER_PREFERENCES);
                localStorage.removeItem(constants.STORAGE_KEYS.LAST_METHOD);
                
                selectedAPI = 'claude';
                logger.info('Settings reset completed');
                return true;
            } catch (error) {
                logger.error('Settings reset failed', error);
                return false;
            }
        }
        
        /**
         * 設定のエクスポート/インポート
         */
        function exportSettings() {
            try {
                const settings = {
                    selectedAPI: getSelectedAPI(),
                    timestamp: new Date().toISOString(),
                    version: constants.ENV.VERSION
                };
                
                return JSON.stringify(settings, null, 2);
            } catch (error) {
                logger.error('Settings export failed', error);
                return null;
            }
        }
        
        function importSettings(settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                
                if (settings.selectedAPI) {
                    setSelectedAPI(settings.selectedAPI);
                }
                
                logger.info('Settings imported successfully', settings);
                return true;
            } catch (error) {
                logger.error('Settings import failed', error);
                return false;
            }
        }
        
        // グローバル関数として公開
        window.setSelectedAPI = setSelectedAPI;
        window.getSelectedAPI = getSelectedAPI;
        window.getSelectedAPIConfig = getSelectedAPIConfig;
        window.validateAPIConfig = validateAPIConfig;
        window.logger = logger;
        window.resetSettings = resetSettings;
        window.exportSettings = exportSettings;
        window.importSettings = importSettings;
        
        // 初期化実行
        const initSuccess = initializeSettings();
        
        // 後方互換性設定を作成
        createLegacyConfig();
        
        // 初期化完了イベント
        window.dispatchEvent(new CustomEvent('config-loaded', {
            detail: {
                success: initSuccess,
                selectedAPI: getSelectedAPI(),
                apiConfig: getSelectedAPIConfig()
            }
        }));
        
        logger.info('Config module loaded successfully');
        
        return {
            setSelectedAPI,
            getSelectedAPI,
            getSelectedAPIConfig,
            validateAPIConfig,
            logger,
            resetSettings,
            exportSettings,
            importSettings
        };
    }
    
    // 設定初期化の実行
    initializeConfig().catch(error => {
        console.error('Config initialization failed:', error);
    });
    
})();