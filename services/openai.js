// services/openai.js - OpenAI API
const axios = require('axios');
const config = require('../config');
const { buildOpenAIPrompts } = require('../prompts');

/**
 * OpenAI API呼び出し
 */
async function callOpenAIAPI(content, method) {
    const apiKey = config.apis.openai.apiKey;
    const model = config.apis.openai.model;
    
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    const { systemPrompt, userPrompt } = buildOpenAIPrompts(content, method);
    
    try {
        const response = await axios({
            url: config.apis.openai.baseUrl,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            data: {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7,
                top_p: 0.95,
                frequency_penalty: 0,
                presence_penalty: 0
            },
            timeout: 20000
        });
        
        const result = response.data?.choices?.[0]?.message?.content?.trim();
        
        if (!result) {
            // フィニッシュ理由を確認
            const finishReason = response.data?.choices?.[0]?.finish_reason;
            if (finishReason === 'content_filter') {
                throw new Error('入力内容がコンテンツポリシーに抵触するため処理できませんでした');
            } else if (finishReason === 'length') {
                throw new Error('出力が最大長に達しました。入力内容をより簡潔にしてください');
            }
            throw new Error('OpenAI APIから有効な応答が得られませんでした');
        }
        
        return result;
        
    } catch (error) {
        console.error('OpenAI API呼び出しエラー:', error.response?.data || error.message);
        
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            switch (status) {
                case 401:
                    throw new Error('OpenAI API 401エラー: APIキーが無効です');
                case 403:
                    throw new Error('OpenAI API 403エラー: APIキーの権限が不足しています');
                case 429:
                    const errorType = errorData?.error?.type;
                    if (errorType === 'insufficient_quota') {
                        throw new Error('OpenAI API 429エラー: APIの利用制限に達しました。課金残高を確認してください');
                    } else {
                        throw new Error('OpenAI API 429エラー: レート制限に達しました。しばらく待ってから再試行してください');
                    }
                case 400:
                    const errorMessage = errorData?.error?.message || '入力内容に問題があります';
                    throw new Error(`OpenAI API 400エラー: ${errorMessage}`);
                case 503:
                    throw new Error('OpenAI API 503エラー: サーバーが一時的に利用できません');
                default:
                    throw new Error(`OpenAI API ${status}エラー: ${errorData?.error?.message || 'Unknown error'}`);
            }
        }
        
        if (error.code === 'ECONNABORTED') {
            throw new Error('変換処理がタイムアウトしました');
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('OpenAI APIに接続できませんでした');
        }
        
        throw new Error(`変換処理中にエラーが発生しました: ${error.message}`);
    }
}

module.exports = {
    callOpenAIAPI
};