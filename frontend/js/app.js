// app.js - メインアプリケーション（constants.js, config.js, api.js依存）
// 全ての依存ファイルの読み込み完了後に実行される

(function() {
    'use strict';
    
    // 依存関係の読み込み完了を待機
    function waitForAllDependencies() {
        return new Promise((resolve) => {
            let constantsLoaded = false;
            let configLoaded = false;
            let apiLoaded = false;
            
            function checkReady() {
                if (constantsLoaded && configLoaded && apiLoaded) {
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
            
            // api.js の読み込み確認
            if (typeof window.api !== 'undefined') {
                apiLoaded = true;
            } else {
                window.addEventListener('api-loaded', () => {
                    apiLoaded = true;
                    checkReady();
                }, { once: true });
            }
            
            checkReady();
        });
    }
    
    // アプリケーション初期化
    async function initializeApp() {
        await waitForAllDependencies();
        
        const constants = window.APP_CONSTANTS;
        const logger = window.logger;
        
        /**
         * 定数の安全な取得
         */
        function getAppConstants() {
            if (typeof constants === 'undefined') {
                console.error('Constants not loaded. Make sure constants.js is loaded first.');
                return {
                    ELEMENT_IDS: {},
                    MESSAGES: { STATUS: {}, SUCCESS: {}, ERROR: {}, LOADING: {} },
                    UI_LIMITS: {},
                    EVENTS: {},
                    PRESET_METHODS: [],
                    API_OPTIONS: {},
                    SECURITY_PATTERNS: [],
                    DEBUG: { ENABLED: false },
                    FEATURES: {}
                };
            }
            return constants;
        }
        
        const appConstants = getAppConstants();
        
        // DOM要素の安全な取得
        function getElement(id, fallback = null) {
            const element = document.getElementById(id);
            if (!element && appConstants.DEBUG.ENABLED) {
                console.warn(`Element not found: ${id}`);
            }
            return element || fallback;
        }
        
        // DOM要素の取得
        const convertForm = getElement(appConstants.ELEMENT_IDS.CONVERT_FORM);
        const contentInput = getElement(appConstants.ELEMENT_IDS.CONTENT_INPUT);
        const methodInput = getElement(appConstants.ELEMENT_IDS.METHOD_INPUT);
        const convertBtn = getElement(appConstants.ELEMENT_IDS.CONVERT_BTN);
        const resultSection = getElement(appConstants.ELEMENT_IDS.RESULT_SECTION);
        const resultContent = getElement(appConstants.ELEMENT_IDS.RESULT_CONTENT);
        const copyBtn = getElement(appConstants.ELEMENT_IDS.COPY_BTN);
        const statusCard = getElement(appConstants.ELEMENT_IDS.STATUS_CARD);
        const statusIcon = getElement(appConstants.ELEMENT_IDS.STATUS_ICON);
        const statusTitle = getElement(appConstants.ELEMENT_IDS.STATUS_TITLE);
        const statusSubtitle = getElement(appConstants.ELEMENT_IDS.STATUS_SUBTITLE);
        
        // その他の要素
        const apiOptions = document.querySelectorAll('.api-option');
        const methodButtons = document.querySelectorAll('.method-btn');
        
        // アプリケーション状態
        let isConverting = false;
        
        /**
         * イベントリスナーの設定
         */
        function setupEventListeners() {
            // フォーム送信
            if (convertForm) {
                convertForm.addEventListener('submit', handleSubmit);
            }
            
            // コピーボタン
            if (copyBtn) {
                copyBtn.addEventListener('click', handleCopy);
            }
            
            // 入力フィールドの自動リサイズ
            if (contentInput) {
                contentInput.addEventListener('input', handleContentInputChange);
            }
            
            // Enterキーで送信
            if (methodInput) {
                methodInput.addEventListener('keypress', handleMethodInputKeypress);
            }
            
            // セキュリティチェック
            [contentInput, methodInput].filter(Boolean).forEach(input => {
                input.addEventListener('input', validateInputSecurity);
            });
            
            logger.info('Event listeners setup completed');
        }
        
        /**
         * API選択機能の設定
         */
        function setupAPISelection() {
            if (!apiOptions || apiOptions.length === 0) {
                logger.warn('API selection elements not found');
                return;
            }
            
            // 保存された選択を復元
            const savedAPI = window.getSelectedAPI();
            updateAPISelection(savedAPI);
            
            // API選択イベント
            apiOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const apiType = option.dataset.api;
                    if (window.setSelectedAPI(apiType)) {
                        updateAPISelection(apiType);
                        
                        const apiConfig = appConstants.API_OPTIONS[apiType.toUpperCase()] || { name: apiType };
                        showToast(`${apiConfig.name} APIを選択しました`, 2000, 'success');
                        
                        // フィードバック効果
                        option.style.transform = 'scale(0.95)';
                        setTimeout(() => option.style.transform = '', 150);
                    }
                });
                
                // キーボードアクセシビリティ
                option.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        option.click();
                    }
                });
            });
        }
        
        /**
         * API選択表示の更新
         */
        function updateAPISelection(selectedAPI) {
            if (!apiOptions || apiOptions.length === 0) return;
            
            const selectedConfig = appConstants.API_OPTIONS[selectedAPI.toUpperCase()] || { name: selectedAPI };
            
            apiOptions.forEach(option => {
                option.classList.remove('selected');
                if (option.dataset.api === selectedAPI) {
                    option.classList.add('selected');
                }
            });
            
            // ステータス更新
            showStatus('ready', `${selectedConfig.name} API 準備完了`, 'テキストを入力して変換を開始してください');
        }
        
        /**
         * 準備完了状態を設定
         */
        function setReadyStatus() {
            const apiConfig = window.getSelectedAPIConfig();
            showStatus('ready', `${apiConfig.name} API 準備完了`, 'テキストを入力して変換を開始してください');
        }
        
        /**
         * プリセットボタンの設定
         */
        function setupPresetButtons() {
            if (!methodButtons || methodButtons.length === 0) {
                logger.warn('Preset buttons not found');
                return;
            }
            
            // プリセット方式からボタンを動的に設定
            appConstants.PRESET_METHODS.forEach((preset, index) => {
                const button = methodButtons[index];
                if (button) {
                    const methodName = typeof preset === 'object' ? preset.name : preset;
                    button.dataset.method = methodName;
                    
                    // クリックイベント
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        handlePresetSelection(methodName, button);
                    });
                }
            });
        }
        
        /**
         * プリセット選択処理
         */
        function handlePresetSelection(methodName, buttonElement) {
            if (methodInput) {
                methodInput.value = methodName;
            }
            
            showToast(`変換方式: ${methodName}`, 1500);
            
            // フィードバック効果
            buttonElement.style.transform = 'scale(0.95)';
            setTimeout(() => buttonElement.style.transform = '', 150);
        }
        
        /**
         * 文字数カウンター設定
         */
        function setupCharacterCounter() {
            if (!contentInput) return;
            
            const counter = document.createElement('div');
            counter.id = appConstants.ELEMENT_IDS.CHARACTER_COUNTER;
            counter.style.cssText = `
                text-align: right;
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-top: 5px;
            `;
            
            contentInput.parentNode.appendChild(counter);
            updateCharacterCounter();
        }
        
        /**
         * 文字数カウンター更新
         */
        function updateCharacterCounter() {
            const counter = document.getElementById(appConstants.ELEMENT_IDS.CHARACTER_COUNTER);
            if (!counter || !contentInput) return;
            
            const length = contentInput.value.length;
            const max = appConstants.UI_LIMITS.MAX_CONTENT_LENGTH || 1000;
            counter.textContent = `${length}/${max}文字`;
            
            if (length > max - 100) {
                counter.style.color = '#ff6b6b';
            } else if (length > max - 200) {
                counter.style.color = '#ffa726';
            } else {
                counter.style.color = 'var(--text-secondary)';
            }
        }
        
        /**
         * コンテンツ入力変更処理
         */
        function handleContentInputChange() {
            if (!contentInput) return;
            
            // 自動リサイズ
            contentInput.style.height = 'auto';
            contentInput.style.height = Math.min(contentInput.scrollHeight, 300) + 'px';
            
            // 文字数カウンター更新
            updateCharacterCounter();
        }
        
        /**
         * メソッド入力のキープレス処理
         */
        function handleMethodInputKeypress(e) {
            if (e.key === 'Enter' && !e.shiftKey && !isConverting && 
                contentInput && methodInput && 
                contentInput.value.trim() && methodInput.value.trim()) {
                e.preventDefault();
                if (convertForm) {
                    convertForm.dispatchEvent(new Event('submit'));
                }
            }
        }
        
        /**
         * 入力セキュリティ検証
         */
        function validateInputSecurity(e) {
            const input = e.target.value;
            const patterns = appConstants.SECURITY_PATTERNS || [];
            
            for (const pattern of patterns) {
                if (pattern.test && pattern.test(input)) {
                    showToast('不適切な入力が検出されました', 3000, 'error');
                    e.target.value = input.replace(pattern, '');
                    break;
                }
            }
        }
        
        /**
         * フォーム送信処理
         */
        async function handleSubmit(event) {
            event.preventDefault();
            
            if (isConverting) {
                logger.warn('Conversion already in progress');
                return;
            }
            
            try {
                // 入力検証
                const { content, method } = validateFormInput();
                
                logger.info(`Conversion started: method="${method}", content="${content.substring(0, 50)}..."`);
                
                const selectedAPI = window.getSelectedAPI();
                const apiConfig = window.getSelectedAPIConfig();
                
                setConvertingState(true);
                showStatus('converting', '変換処理中', `${apiConfig.name} APIが文章を変換しています...`);
                
                if (window.api && window.api.convertText) {
                    const result = await window.api.convertText(content, method, selectedAPI);
                    
                    if (result?.convertedText) {
                        displayResult(result.convertedText);
                        showToast('変換が完了しました', 2000, 'success');
                        showStatus('completed', '変換完了', '結果が表示されました');
                        logger.info('Conversion completed successfully');
                    } else {
                        throw new Error('変換結果が空です');
                    }
                } else {
                    throw new Error('API client not available');
                }
                
            } catch (error) {
                logger.error('Conversion error:', error);
                handleError(error);
                showStatus('error', '変換エラー', 'エラーが発生しました');
            } finally {
                setConvertingState(false);
            }
        }
        
        /**
         * フォーム入力検証
         */
        function validateFormInput() {
            if (!contentInput || !methodInput) {
                throw new Error('Input elements not found');
            }
            
            const content = contentInput.value.trim();
            const method = methodInput.value.trim();
            
            if (!content) {
                if (contentInput.focus) contentInput.focus();
                throw new Error('変換するテキストを入力してください');
            }
            
            if (!method) {
                if (methodInput.focus) methodInput.focus();
                throw new Error('変換方式を入力してください');
            }
            
            const maxContentLength = appConstants.UI_LIMITS.MAX_CONTENT_LENGTH || 1000;
            
            if (content.length > maxContentLength) {
                throw new Error(`テキストは${maxContentLength}文字以内で入力してください`);
            }
            
            return { content, method };
        }
        
        /**
         * 変換状態の切り替え
         */
        function setConvertingState(converting) {
            isConverting = converting;
            if (convertBtn) {
                convertBtn.disabled = converting;
            }
            
            if (converting) {
                if (convertBtn) {
                    convertBtn.innerHTML = `
                        <div class="loading">
                            <div class="spinner"></div>
                            <span>変換中...</span>
                        </div>
                    `;
                }
                
                if (resultSection) {
                    resultSection.style.display = 'block';
                }
                
                if (resultContent) {
                    resultContent.innerHTML = `
                        <div class="loading">
                            <div class="spinner"></div>
                            <span>変換処理中です...</span>
                        </div>
                    `;
                }
            } else {
                if (convertBtn) {
                    convertBtn.innerHTML = '<i class="fas fa-magic"></i> 変換開始';
                }
            }
        }
        
        /**
         * 結果表示
         */
        function displayResult(convertedText) {
            if (resultContent) {
                resultContent.textContent = convertedText;
            }
            
            if (resultSection) {
                resultSection.classList.add('show'); // この行を追加
                
                setTimeout(() => {
                    resultSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 300);
            }
        }
        
        /**
         * エラー処理
         */
        function handleError(error) {
            const message = error.message.toLowerCase();
            let errorMsg = 'エラーが発生しました';
            
            if (message.includes('timeout')) {
                errorMsg = '処理がタイムアウトしました';
            } else if (message.includes('network') || message.includes('fetch')) {
                errorMsg = 'ネットワークエラーが発生しました';
            } else if (message.includes('400')) {
                errorMsg = '入力内容に問題があります';
            } else if (error.message.length > 0) {
                errorMsg = error.message;
            }
            
            if (resultSection) {
                resultSection.style.display = 'block';
            }
            
            if (resultContent) {
                resultContent.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>エラーが発生しました</strong><br>
                        ${errorMsg}
                    </div>
                `;
            }
            
            showToast(errorMsg, 4000, 'error');
        }
        
        /**
         * コピー機能
         */
        async function handleCopy() {
            if (!resultContent) return;
            
            const text = resultContent.textContent;
            
            if (!text?.trim()) {
                showToast('コピーするテキストがありません', 2000, 'error');
                return;
            }
            
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // フォールバック
                    fallbackCopyToClipboard(text);
                }
                
                showToast('コピー完了', 2000, 'success');
                
                // ボタンフィードバック
                if (copyBtn) {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> コピー完了';
                    copyBtn.style.background = 'var(--accent-gradient)';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.background = '';
                    }, 1500);
                }
                
                logger.info('Text copied to clipboard successfully');
                
            } catch (error) {
                logger.error('Copy error:', error);
                showToast('コピーに失敗しました', 2000, 'error');
            }
        }
        
        /**
         * フォールバック用コピー処理
         */
        function fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }
        
        /**
         * ステータス更新
         */
        function showStatus(status, title, subtitle) {
            const config = {
                ready: { icon: 'fa-check-circle', color: 'var(--success-gradient)' },
                converting: { icon: 'fa-sync fa-spin', color: 'var(--secondary-gradient)' },
                completed: { icon: 'fa-check-circle', color: 'var(--accent-gradient)' },
                error: { icon: 'fa-exclamation-triangle', color: '#ff6b6b' }
            };
            
            const { icon, color } = config[status] || config.ready;
            
            if (statusIcon) {
                statusIcon.className = `fas ${icon}`;
                statusIcon.style.background = color;
                statusIcon.style.webkitBackgroundClip = 'text';
                statusIcon.style.webkitTextFillColor = 'transparent';
            }
            
            if (statusTitle) {
                statusTitle.textContent = title;
            }
            
            if (statusSubtitle) {
                statusSubtitle.textContent = subtitle;
            }
        }
        
        /**
         * トースト通知
         */
        function showToast(message, duration = 3000, type = 'info') {
            // 既存のトーストを削除
            document.querySelector('.toast')?.remove();
            
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            
            // タイプ別の色設定
            const colors = {
                error: 'linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 87, 87, 0.9))',
                success: 'linear-gradient(135deg, rgba(67, 233, 123, 0.9), rgba(56, 249, 215, 0.9))',
                warning: 'linear-gradient(135deg, rgba(255, 167, 38, 0.9), rgba(255, 152, 0, 0.9))',
                info: 'linear-gradient(135deg, rgba(79, 172, 254, 0.9), rgba(0, 242, 254, 0.9))'
            };
            
            if (colors[type]) {
                toast.style.background = colors[type];
            }
            
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        // エラーメッセージ用スタイル（動的に追加）
        const errorStyles = document.createElement('style');
        errorStyles.textContent = `
            .error-message {
                color: #ff6b6b;
                text-align: center;
                padding: 20px;
                border: 1px solid rgba(255, 107, 107, 0.3);
                border-radius: 12px;
                background: rgba(255, 107, 107, 0.1);
                backdrop-filter: blur(10px);
            }
            .error-message i {
                font-size: 1.5rem;
                margin-bottom: 10px;
                display: block;
            }
        `;
        document.head.appendChild(errorStyles);
        
        // 初期化処理の実行
        try {
            // UIセットアップ
            setupEventListeners();
            setupAPISelection();
            setupCharacterCounter();
            setupPresetButtons();
            
            // 準備完了状態に設定
            setReadyStatus();
            
            logger.info('Application initialization completed successfully');
            
            // 初期化完了イベント
            window.dispatchEvent(new CustomEvent('app-loaded', {
                detail: {
                    success: true,
                    timestamp: new Date().toISOString()
                }
            }));
            
        } catch (error) {
            logger.error('Application initialization failed:', error);
            showStatus('error', 'エラー', error.message);
        }
    }
    
    // DOM読み込み完了後にアプリケーションを初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 AI言語変換アプリを初期化中...');
            initializeApp().catch(error => {
                console.error('❌ Application initialization failed:', error);
            });
        });
    } else {
        // すでにDOM読み込みが完了している場合
        console.log('🚀 AI言語変換アプリを初期化中...');
        initializeApp().catch(error => {
            console.error('❌ Application initialization failed:', error);
        });
    }
    
})();