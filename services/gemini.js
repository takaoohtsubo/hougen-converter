// services/gemini.js - Gemini API
const axios = require('axios');
const config = require('../config');
const { buildGeminiPrompt } = require('../prompts');

/**
 * Gemini API呼び出し
 */
async function callGeminiAPI(content, method) {
    const apiKey = config.apis.gemini.apiKey;
    const model = config.apis.gemini.model;
    
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    const prompt = buildGeminiPrompt(content, method);
    
    try {
        const response = await axios({
            url: `${config.apis.gemini.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            },
            timeout: 25000
        });
        
        const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!result) {
            // フィルタリングされた場合の処理
            const finishReason = response.data?.candidates?.[0]?.finishReason;
            if (finishReason === 'SAFETY') {
                throw new Error('入力内容が安全性ガイドラインに抵触するため処理できませんでした');
            }
            throw new Error('Gemini APIから有効な応答が得られませんでした');
        }
        
        // モデル名を結果の最後に追加
        return result + `\n\n---\n実行モデル: ${config.apis.gemini.model}`;
        
    } catch (error) {
        console.error('Gemini API呼び出しエラー:', error.response?.data || error.message);
        
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            switch (status) {
                case 401:
                    throw new Error('Gemini API 401エラー: APIキーが無効です');
                case 403:
                    throw new Error('Gemini API 403エラー: APIキーの権限が不足しているか、配当が不足しています');
                case 429:
                    throw new Error('Gemini API 429エラー: 利用制限に達しました。しばらく待ってから再試行してください');
                case 400:
                    const errorMessage = errorData?.error?.message || '入力内容に問題があります';
                    throw new Error(`Gemini API 400エラー: ${errorMessage}`);
                default:
                    throw new Error(`Gemini API ${status}エラー: ${errorData?.error?.message || 'Unknown error'}`);
            }
        }
        
        if (error.code === 'ECONNABORTED') {
            throw new Error('変換処理がタイムアウトしました');
        }
        
        throw new Error(`変換処理中にエラーが発生しました: ${error.message}`);
    }
}

module.exports = {
    callGeminiAPI
};