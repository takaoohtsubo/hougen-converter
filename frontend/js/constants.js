// constants.js - アプリケーション定数統合管理
// 全てのJSファイルとHTMLで使用する定数を一元管理

(function() {
    'use strict';
    
    /**
     * 環境・デプロイ設定
     */
    const ENV = {
        IS_DEVELOPMENT: false,
        IS_PRODUCTION: true,
        VERSION: '1.0.0'
    };

    /**
     * API関連定数
     */
    const API_CONFIG = {
        // ベースURL設定
        BASE_URL: 'yourCloudRunURL',
        
        // エンドポイント定義
        ENDPOINTS: {
            HEALTH: '/health',
            CONVERT_CLAUDE: '/convertText',
            CONVERT_GEMINI: '/convertTextGemini',
            CONVERT_CHATGPT: '/convertTextChatGPT'
        },
        
        // タイムアウト・リトライ設定
        TIMEOUT: 30000, // 30秒
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000, // 1秒
        
        // レスポンス関連
        STATUS_CODES: {
            OK: 200,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            TOO_MANY_REQUESTS: 429,
            INTERNAL_SERVER_ERROR: 500
        }
    };

    /**
     * API選択肢定義
     */
    const API_OPTIONS = {
        CLAUDE: {
            id: 'claude',
            name: 'Claude',
            description: '高精度・安定性重視',
            icon: 'fa-brain',
            endpoint: API_CONFIG.ENDPOINTS.CONVERT_CLAUDE,
            gradient: 'linear-gradient(135deg, #ff8a80 0%, #ff5722 100%)',
            borderColor: 'rgba(255, 87, 34, 0.3)',
            selectedBorderColor: '#ff5722',
            shadowColor: 'rgba(255, 87, 34, 0.4)'
        },
        GEMINI: {
            id: 'gemini', 
            name: 'Gemini',
            description: '高速・無料枠大',
            icon: 'fa-star',
            endpoint: API_CONFIG.ENDPOINTS.CONVERT_GEMINI,
            gradient: 'linear-gradient(135deg, #81c784 0%, #4caf50 100%)',
            borderColor: 'rgba(76, 175, 80, 0.3)',
            selectedBorderColor: '#4caf50',
            shadowColor: 'rgba(76, 175, 80, 0.4)'
        },
        CHATGPT: {
            id: 'chatgpt',
            name: 'ChatGPT',
            description: '汎用性・多言語対応',
            icon: 'fa-comments',
            endpoint: API_CONFIG.ENDPOINTS.CONVERT_CHATGPT,
            gradient: 'linear-gradient(135deg, #00d4aa 0%, #00a085 100%)',
            borderColor: 'rgba(0, 212, 170, 0.3)',
            selectedBorderColor: '#00d4aa',
            shadowColor: 'rgba(0, 212, 170, 0.4)'
        }
    };

    /**
     * UI制限値・設定
     */
    const UI_LIMITS = {
        // 文字数制限
        MAX_CONTENT_LENGTH: 1000,
        MAX_METHOD_LENGTH: 100,
        CHAR_WARNING_THRESHOLD: 900,
        
        // アニメーション
        ANIMATION_DURATION: 300,
        ANIMATION_DELAY: 100,
        
        // その他UI設定
        TOAST_DURATION: 3000,
        TOAST_SUCCESS_DURATION: 2000,
        TOAST_ERROR_DURATION: 4000,
        COPY_FEEDBACK_DURATION: 1500,
        
        // レスポンシブブレークポイント
        BREAKPOINTS: {
            MOBILE: 480,
            TABLET: 768,
            DESKTOP: 1024,
            LARGE: 1200
        }
    };

    /**
     * プリセット変換方式
     */
    const PRESET_METHODS = [
        {
            id: 'kansai',
            name: '関西弁',
            icon: 'fa-smile',
            description: '親しみやすい関西弁に変換'
        },
        {
            id: 'keigo',
            name: '敬語',
            icon: 'fa-user-tie',
            description: 'ビジネス向け丁寧語に変換'
        },
        {
            id: 'casual',
            name: 'カジュアル',
            icon: 'fa-coffee',
            description: '友達同士の会話調に変換'
        },
        {
            id: 'business',
            name: 'ビジネス調',
            icon: 'fa-briefcase',
            description: 'フォーマルなビジネス文書に変換'
        },
        {
            id: 'child',
            name: '子供向け',
            icon: 'fa-child',
            description: '子供にも分かりやすい表現に変換'
        },
        {
            id: 'english',
            name: '英語風',
            icon: 'fa-globe',
            description: '英語的な表現に変換'
        }
    ];

    /**
     * 追加プリセット（サーバー側対応）
     */
    const ADDITIONAL_PRESETS = [
        '博多弁', '津軽弁', '沖縄弁', '要約', '箇条書き', 'フォーマル'
    ];

    /**
     * メッセージ定数
     */
    const MESSAGES = {
        // ローディングメッセージ
        LOADING: {
            GENERAL: '変換処理中です...',
            CLAUDE: 'Claude APIで変換処理中です...',
            GEMINI: 'Gemini APIで変換処理中です...',
            CHATGPT: 'ChatGPT APIで変換処理中です...',
            INITIALIZING: 'アプリケーションを初期化中...',
            HEALTH_CHECK: 'サーバー接続を確認中...'
        },
        
        // 成功メッセージ
        SUCCESS: {
            CONVERT: '変換が完了しました',
            COPY: 'コピー完了',
            SHARE: '共有しました',
            API_SELECTED: 'APIを選択しました'
        },
        
        // エラーメッセージ
        ERROR: {
            NETWORK: 'ネットワークエラーが発生しました',
            TIMEOUT: '処理がタイムアウトしました',
            SERVER_ERROR: 'サーバーエラーが発生しました',
            VALIDATION: '入力内容に問題があります',
            UNKNOWN: '予期しないエラーが発生しました',
            COPY_FAILED: 'コピーに失敗しました',
            SHARE_FAILED: '共有に失敗しました',
            CONTENT_REQUIRED: '変換するテキストを入力してください',
            METHOD_REQUIRED: '変換方式を入力してください',
            CONTENT_TOO_LONG: 'テキストは1000文字以内で入力してください',
            METHOD_TOO_LONG: '変換方式は100文字以内で入力してください',
            INVALID_INPUT: '不適切な入力が検出されました',
            RATE_LIMIT: '利用制限に達しました。しばらく時間をおいてから再試行してください',
            API_KEY_INVALID: 'APIキーが無効です',
            API_PERMISSION: 'APIキーの権限が不足しています',
            SAFETY_FILTER: '入力内容が安全性ガイドラインに抵触するため処理できませんでした'
        },
        
        // 状態メッセージ
        STATUS: {
            READY: 'テキストを入力して変換を開始してください',
            CONVERTING: '変換処理中...',
            COMPLETED: '変換が完了しました',
            ERROR: 'エラーが発生しました',
            INITIALIZING: 'アプリケーションを準備中...',
            API_READY: 'API 準備完了'
        },
        
        // プレースホルダー
        PLACEHOLDERS: {
            CONTENT: 'ここに変換したいテキストを入力してください...',
            METHOD: '例: 怒った感じで、3歳児でも分かるように、Shakespeare風に...'
        },
        
        // 確認メッセージ
        CONFIRM: {
            CLEAR_CONTENT: '入力内容をクリアしますか？',
            RESET_SETTINGS: '設定をリセットしますか？'
        }
    };

    /**
     * CSS関連定数
     */
    const CSS = {
        // アニメーションクラス
        ANIMATIONS: {
            FADE_IN: 'animate-fadeIn',
            FADE_IN_UP: 'animate-fadeInUp',
            SLIDE_IN_LEFT: 'animate-slideInLeft',
            SLIDE_IN_RIGHT: 'animate-slideInRight',
            SCALE_IN: 'animate-scaleIn',
            SHAKE: 'animate-shake',
            GLOW: 'animate-glow'
        },
        
        // 状態クラス
        STATES: {
            LOADING: 'loading',
            SUCCESS: 'success',
            ERROR: 'error',
            DISABLED: 'disabled',
            SELECTED: 'selected',
            ACTIVE: 'active',
            HIDDEN: 'hidden',
            VISIBLE: 'visible'
        },
        
        // カラー定数
        COLORS: {
            PRIMARY: '#667eea',
            SECONDARY: '#764ba2',
            ACCENT: '#4facfe',
            SUCCESS: '#43e97b',
            WARNING: '#ffa726',
            ERROR: '#ff6b6b',
            INFO: '#42a5f5'
        }
    };

    /**
     * イベント名定数
     */
    const EVENTS = {
        // DOM Events
        CLICK: 'click',
        INPUT: 'input',
        CHANGE: 'change',
        SUBMIT: 'submit',
        FOCUS: 'focus',
        BLUR: 'blur',
        KEYPRESS: 'keypress',
        KEYDOWN: 'keydown',
        KEYUP: 'keyup',
        
        // Custom Events
        API_SELECTED: 'api-selected',
        CONVERT_START: 'convert-start',
        CONVERT_SUCCESS: 'convert-success',
        CONVERT_ERROR: 'convert-error',
        METHOD_SELECTED: 'method-selected'
    };

    /**
     * DOM要素ID定数
     */
    const ELEMENT_IDS = {
        // フォーム要素
        CONVERT_FORM: 'convertForm',
        CONTENT_INPUT: 'contentInput',
        METHOD_INPUT: 'methodInput',
        CONVERT_BTN: 'convertBtn',
        
        // 結果表示要素
        RESULT_SECTION: 'resultSection',
        RESULT_CONTENT: 'resultContent',
        COPY_BTN: 'copyBtn',
        
        // ステータス要素
        STATUS_CARD: 'statusCard',
        STATUS_ICON: 'statusIcon',
        STATUS_TITLE: 'statusTitle',
        STATUS_SUBTITLE: 'statusSubtitle',
        
        // その他
        CHARACTER_COUNTER: 'characterCounter'
    };

    /**
     * ローカルストレージキー
     */
    const STORAGE_KEYS = {
        SELECTED_API: 'selectedAPI',
        USER_PREFERENCES: 'userPreferences',
        LAST_METHOD: 'lastMethod',
        USAGE_STATS: 'usageStats'
    };

    /**
     * セキュリティパターン（危険な入力検出用）
     */
    const SECURITY_PATTERNS = [
        /<script|javascript:|on\w+=/i,
        /\b(eval|function|constructor)\s*\(/i,
        /\b(document|window|global)\./i,
        /(union|select|insert|delete|drop|create|alter)\s+/i
    ];

    /**
     * デバッグ設定
     */
    const DEBUG = {
        ENABLED: ENV.IS_DEVELOPMENT,
        LOG_LEVEL: ENV.IS_DEVELOPMENT ? 'debug' : 'error',
        SHOW_API_RESPONSES: ENV.IS_DEVELOPMENT,
        SHOW_PERFORMANCE_METRICS: ENV.IS_DEVELOPMENT
    };

    /**
     * フィーチャーフラグ
     */
    const FEATURES = {
        SHARE_API: typeof navigator !== 'undefined' && 'share' in navigator,
        CLIPBOARD_API: typeof navigator !== 'undefined' && 'clipboard' in navigator,
        NOTIFICATIONS: typeof Notification !== 'undefined',
        OFFLINE_SUPPORT: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
        PERFORMANCE_OBSERVER: typeof window !== 'undefined' && 'PerformanceObserver' in window
    };

    // グローバル名前空間の作成（変数競合を避けるため）
    window.APP_CONSTANTS = {
        ENV,
        API_CONFIG,
        API_OPTIONS,
        UI_LIMITS,
        PRESET_METHODS,
        ADDITIONAL_PRESETS,
        MESSAGES,
        CSS,
        EVENTS,
        ELEMENT_IDS,
        STORAGE_KEYS,
        SECURITY_PATTERNS,
        DEBUG,
        FEATURES
    };
    
    // ログ出力
    console.log('📦 Constants loaded successfully');
    
    // 初期化完了イベントの発火
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('constants-loaded', {
            detail: window.APP_CONSTANTS
        }));
    }
})();