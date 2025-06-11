// UI制御クラス
class UIController {
    constructor() {
        this.elements = this.initializeElements();
        this.bindEvents();
        this.initializeUI();
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        return {
            form: document.getElementById('convertForm'),
            methodInput: document.getElementById('methodInput'),
            methodDropdown: document.getElementById('methodDropdown'),
            methodOptions: document.querySelectorAll('.method-option'),
            contentTextarea: document.getElementById('documentContent'),
            charCounter: document.getElementById('charCounter'),
            resultSection: document.getElementById('resultSection'),
            resultContent: document.getElementById('resultContent'),
            convertBtn: document.getElementById('convertBtn'),
            copyBtn: document.getElementById('copyBtn'),
            shareBtn: document.getElementById('shareBtn'),
            infoPanel: document.getElementById('infoPanel'),
            apiEndpoint: document.getElementById('api-endpoint')
        };
    }

    /**
     * イベントの設定
     */
    bindEvents() {
        // 文字数カウンター
        this.elements.contentTextarea.addEventListener('input', () => this.updateCharCounter());
        
        // メソッド入力のオートコンプリート
        this.elements.methodInput.addEventListener('input', () => this.handleMethodInput());
        this.elements.methodInput.addEventListener('focus', () => this.showMethodDropdown());
        
        // ドロップダウン制御
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
        
        // メソッド選択
        this.elements.methodOptions.forEach(option => {
            option.addEventListener('click', () => this.selectMethod(option));
        });
        
        // コピー機能
        this.elements.copyBtn.addEventListener('click', () => this.copyResult());
        
        // 共有機能
        this.elements.shareBtn.addEventListener('click', () => this.shareResult());
    }

    /**
     * UI初期化
     */
    initializeUI() {
        this.updateCharCounter();
        this.elements.methodInput.focus();
        
        // API エンドポイント表示更新
        if (ENV.IS_DEVELOPMENT) {
            this.elements.apiEndpoint.textContent = `エンドポイント: ${APP_CONFIG.API.ENDPOINTS.CONVERT} (ローカル)`;
        }
    }

    /**
     * 文字数カウンター更新
     */
    updateCharCounter() {
        const count = this.elements.contentTextarea.value.length;
        this.elements.charCounter.textContent = `${count}/${APP_CONFIG.UI.MAX_CONTENT_LENGTH}文字`;
        
        if (count > APP_CONFIG.UI.CHAR_WARNING_THRESHOLD) {
            this.elements.charCounter.classList.add('warning');
        } else {
            this.elements.charCounter.classList.remove('warning');
        }
    }

    /**
     * メソッド入力処理
     */
    handleMethodInput() {
        const value = this.elements.methodInput.value.toLowerCase();
        let hasMatch = false;

        this.elements.methodOptions.forEach(option => {
            const methodText = option.getAttribute('data-method').toLowerCase();
            const isMatch = methodText.includes(value) || value === '';
            option.style.display = isMatch ? 'flex' : 'none';
            if (isMatch) hasMatch = true;
        });

        this.elements.methodDropdown.style.display = value && hasMatch ? 'block' : 'none';
    }

    /**
     * メソッドドロップダウン表示
     */
    showMethodDropdown() {
        this.elements.methodDropdown.style.display = 'block';
    }

    /**
     * ドキュメントクリック処理
     */
    handleDocumentClick(e) {
        if (!this.elements.methodInput.contains(e.target) && 
            !this.elements.methodDropdown.contains(e.target)) {
            this.elements.methodDropdown.style.display = 'none';
        }
    }

    /**
     * メソッド選択
     */
    selectMethod(option) {
        this.elements.methodInput.value = option.getAttribute('data-method');
        this.elements.methodDropdown.style.display = 'none';
        this.elements.methodInput.focus();
    }

    /**
     * エラー表示
     */
    showError(message, details = null) {
        this.elements.resultSection.classList.add('show');
        this.elements.resultContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <div class="error-message">${message}</div>
                    ${details ? `<div class="error-details">${details}</div>` : ''}
                </div>
            </div>
        `;
        this.elements.resultSection.querySelector('.result-actions').style.display = 'none';
        this.elements.infoPanel.style.display = 'none';
        
        logger.error('UI Error displayed', { message, details });
    }

    /**
     * 成功結果表示
     */
    showSuccess(data) {
        this.elements.resultSection.classList.add('show');
        this.elements.resultContent.innerHTML = `
            <div class="success">
                <div class="success-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="success-text">${data.convertedText}</div>
            </div>
        `;
        this.elements.resultSection.querySelector('.result-actions').style.display = 'flex';
        
        if (data.info) {
            this.showInfoPanel(data.info, data.usage);
        }
        
        logger.info('Success result displayed', data);
    }

    /**
     * ローディング表示
     */
    showLoading() {
        this.elements.resultSection.classList.add('show');
        this.elements.resultContent.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">${APP_CONFIG.MESSAGES.LOADING}</div>
            </div>
        `;
        this.elements.resultSection.querySelector('.result-actions').style.display = 'none';
        this.elements.infoPanel.style.display = 'none';
    }

    /**
     * 情報パネル表示
     */
    showInfoPanel(info, usage = null) {
        let infoHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">変換方式</span>
                    <span class="info-value">${info.method}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">元文字数</span>
                    <span class="info-value">${info.originalLength}文字</span>
                </div>
                <div class="info-item">
                    <span class="info-label">変換後</span>
                    <span class="info-value">${info.convertedLength}文字</span>
                </div>
                <div class="info-item">
                    <span class="info-label">処理時間</span>
                    <span class="info-value">${info.processingTime}</span>
                </div>
            </div>
        `;

        if (usage) {
            infoHTML += `
                <div class="usage-info">
                    <span class="usage-label">利用状況:</span>
                    <span class="usage-value">${usage.limit} (残り${usage.remaining}回)</span>
                </div>
            `;
        }

        this.elements.infoPanel.innerHTML = infoHTML;
        this.elements.infoPanel.style.display = 'block';
    }

    /**
     * ボタン状態制御
     */
    setButtonLoading(loading) {
        this.elements.convertBtn.disabled = loading;
        
        if (loading) {
            this.elements.convertBtn.querySelector('.btn-content').innerHTML = 
                '<i class="fas fa-spinner fa-spin"></i> 変換中...';
        } else {
            this.elements.convertBtn.querySelector('.btn-content').innerHTML = 
                '<i class="fas fa-rocket"></i> 変換開始';
        }
    }

    /**
     * 結果コピー
     */
    async copyResult() {
        try {
            const textToCopy = this.elements.resultContent.querySelector('.success-text').textContent;
            await navigator.clipboard.writeText(textToCopy);
            
            this.showToast(APP_CONFIG.MESSAGES.COPY.SUCCESS, 'success');
            
            const originalContent = this.elements.copyBtn.innerHTML;
            this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i> コピー完了';
            this.elements.copyBtn.classList.add('success');
            
            setTimeout(() => {
                this.elements.copyBtn.innerHTML = originalContent;
                this.elements.copyBtn.classList.remove('success');
            }, 2000);
            
        } catch (error) {
            logger.error('Copy failed', error);
            this.showToast(APP_CONFIG.MESSAGES.COPY.FAILED, 'error');
        }
    }

    /**
     * 結果共有
     */
    async shareResult() {
        const textToShare = this.elements.resultContent.querySelector('.success-text').textContent;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'AI言語変換結果',
                    text: textToShare
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    logger.error('Share failed', error);
                }
            }
        } else {
            // フォールバック: クリップボードにコピー
            try {
                await navigator.clipboard.writeText(textToShare);
                this.showToast('結果をクリップボードにコピーしました', 'info');
            } catch (error) {
                logger.error('Fallback copy failed', error);
                this.showToast('共有機能は利用できません', 'error');
            }
        }
    }

    /**
     * トースト通知表示
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // アニメーション
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, APP_CONFIG.UI.TOAST_DURATION);
    }

    /**
     * 入力検証
     */
    validateInput() {
        const content = this.elements.contentTextarea.value.trim();
        const method = this.elements.methodInput.value.trim();
        
        if (!content) {
            throw new Error('変換したい内容を入力してください');
        }
        
        if (!method) {
            throw new Error('変換スタイルを入力してください');
        }
        
        if (content.length > APP_CONFIG.UI.MAX_CONTENT_LENGTH) {
            throw new Error(`文書は${APP_CONFIG.UI.MAX_CONTENT_LENGTH}文字以内にしてください`);
        }
        
        return { content, method };
    }
}

// UIコントローラーインスタンス
const ui = new UIController();