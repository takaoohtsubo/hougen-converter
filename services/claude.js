// services/claude.js - Claude API
const axios = require('axios');
const config = require('../config');
const { buildClaudePrompts } = require('../prompts');

/**
 * Claude API呼び出し
 */
async function callClaudeAPI(content, method) {
    const apiKey = config.apis.claude.apiKey;
    const model = config.apis.claude.model;
    
    if (!apiKey) {
        throw new Error('CLAUDE_API_KEY is not configured in environment variables');
    }

    const { systemPrompt, userPrompt } = buildClaudePrompts(content, method);
    
    try {
        const response = await axios({
            url: config.apis.claude.baseUrl,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': config.apis.claude.version
            },
            data: {
                model: model,
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: userPrompt
                }]
            },
            timeout: 15000
        });
        
        const result = response.data?.content?.[0]?.text?.trim();
        
        if (!result) {
            throw new Error('Claude APIから有効な応答が得られませんでした');
        }
        
        return result;
        
    } catch (error) {
        console.error('Claude API呼び出しエラー:', error.response?.data || error.message);
        
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            switch (status) {
                case 401:
                    throw new Error('Claude API 401エラー: APIキーが無効です');
                case 403:
                    throw new Error('Claude API 403エラー: APIキーの権限が不足しています');
                case 429:
                    throw new Error('Claude API 429エラー: 利用制限に達しました');
                case 400:
                    throw new Error('Claude API 400エラー: 入力内容に問題があります');
                default:
                    throw new Error(`Claude API ${status}エラー: ${errorData?.error?.message || 'Unknown error'}`);
            }
        }
        
        if (error.code === 'ECONNABORTED') {
            throw new Error('変換処理がタイムアウトしました');
        }
        
        throw new Error(`変換処理中にエラーが発生しました: ${error.message}`);
    }
}

module.exports = {
    callClaudeAPI
};