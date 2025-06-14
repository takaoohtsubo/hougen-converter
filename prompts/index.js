// prompts/index.js - プロンプト管理
const config = require('../config');

/**
 * Claude用プロンプト構築
 */
function buildClaudePrompts(content, method) {
    const systemPrompt = `あなたは高品質な文書変換スペシャリストです。指定された変換方式で、元の意味と情報を正確に保ちながら自然で読みやすい変換を行ってください。`;
    
    let userPrompt;
    
    if (config.presetMethods.includes(method)) {
        switch (method) {
            case '要約':
                userPrompt = `以下の文書を簡潔に要約してください。重要なポイントを漏らさず、元の文書の1/3～1/2程度の長さにまとめてください。\n\n${content}`;
                break;
            case '箇条書き':
                userPrompt = `以下の文書を分かりやすい箇条書き形式に変換してください。論理的な順序で整理し、読みやすくしてください。\n\n${content}`;
                break;
            case '英語':
                userPrompt = `以下の日本語文書を自然で正確な英語に翻訳してください。ビジネス文書として適切な表現を使用してください。\n\n${content}`;
                break;
            case '敬語':
                userPrompt = `以下の文書を適切な敬語表現に変換してください。ビジネスシーンで使用できる丁寧で品格のある文章にしてください。\n\n${content}`;
                break;
            case 'カジュアル':
                userPrompt = `以下の文書をカジュアルで親しみやすい文体に変換してください。友達との会話のような自然な表現を使用してください。\n\n${content}`;
                break;
            case 'フォーマル':
                userPrompt = `以下の文書をフォーマルで正式な文体に変換してください。公式文書や重要な場面で使用できる格式高い表現を使用してください。\n\n${content}`;
                break;
            default:
                userPrompt = `以下の文書を「${method}」で変換してください。その地域の特色ある表現を使い、親しみやすく自然な文章にしてください。\n\n${content}`;
        }
    } else {
        userPrompt = `以下の文書を「${method}」の形式・スタイルで変換してください。指定された方式の特徴を活かしながら、元の意味を正確に保って変換してください。\n\n${content}`;
    }
    
    return { systemPrompt, userPrompt };
}

/**
 * Gemini用プロンプト構築
 */
function buildGeminiPrompt(content, method) {
    const systemInstruction = `あなたは高品質な文書変換スペシャリストです。指定された変換方式で、元の意味と情報を正確に保ちながら自然で読みやすい変換を行ってください。`;
    
    let taskPrompt;
    
    if (config.presetMethods.includes(method)) {
        switch (method) {
            case '要約':
                taskPrompt = `以下の文書を簡潔に要約してください。重要なポイントを漏らさず、元の文書の1/3～1/2程度の長さにまとめてください。`;
                break;
            case '箇条書き':
                taskPrompt = `以下の文書を分かりやすい箇条書き形式に変換してください。論理的な順序で整理し、読みやすくしてください。`;
                break;
            case '英語':
                taskPrompt = `以下の日本語文書を自然で正確な英語に翻訳してください。ビジネス文書として適切な表現を使用してください。`;
                break;
            case '敬語':
                taskPrompt = `以下の文書を適切な敬語表現に変換してください。ビジネスシーンで使用できる丁寧で品格のある文章にしてください。`;
                break;
            case 'カジュアル':
                taskPrompt = `以下の文書をカジュアルで親しみやすい文体に変換してください。友達との会話のような自然な表現を使用してください。`;
                break;
            case 'フォーマル':
                taskPrompt = `以下の文書をフォーマルで正式な文体に変換してください。公式文書や重要な場面で使用できる格式高い表現を使用してください。`;
                break;
            default:
                taskPrompt = `以下の文書を「${method}」で変換してください。その地域の特色ある表現を使い、親しみやすく自然な文章にしてください。`;
        }
    } else {
        taskPrompt = `以下の文書を「${method}」の形式・スタイルで変換してください。指定された方式の特徴を活かしながら、元の意味を正確に保って変換してください。`;
    }
    
    return `${systemInstruction}

${taskPrompt}

【変換対象の文書】
${content}`;
}

/**
 * OpenAI (ChatGPT) 用プロンプト構築
 */
function buildOpenAIPrompts(content, method) {
    const systemPrompt = `あなたは高品質な文書変換スペシャリストです。指定された変換方式で、元の意味と情報を正確に保ちながら自然で読みやすい変換を行ってください。`;
    
    let userPrompt;
    
    if (config.presetMethods.includes(method)) {
        switch (method) {
            case '要約':
                userPrompt = `以下の文書を簡潔に要約してください。重要なポイントを漏らさず、元の文書の1/3～1/2程度の長さにまとめてください。\n\n${content}`;
                break;
            case '箇条書き':
                userPrompt = `以下の文書を分かりやすい箇条書き形式に変換してください。論理的な順序で整理し、読みやすくしてください。\n\n${content}`;
                break;
            case '英語':
                userPrompt = `以下の日本語文書を自然で正確な英語に翻訳してください。ビジネス文書として適切な表現を使用してください。\n\n${content}`;
                break;
            case '敬語':
                userPrompt = `以下の文書を適切な敬語表現に変換してください。ビジネスシーンで使用できる丁寧で品格のある文章にしてください。\n\n${content}`;
                break;
            case 'カジュアル':
                userPrompt = `以下の文書をカジュアルで親しみやすい文体に変換してください。友達との会話のような自然な表現を使用してください。\n\n${content}`;
                break;
            case 'フォーマル':
                userPrompt = `以下の文書をフォーマルで正式な文体に変換してください。公式文書や重要な場面で使用できる格式高い表現を使用してください。\n\n${content}`;
                break;
            default:
                userPrompt = `以下の文書を「${method}」で変換してください。その地域の特色ある表現を使い、親しみやすく自然な文章にしてください。\n\n${content}`;
        }
    } else {
        userPrompt = `以下の文書を「${method}」の形式・スタイルで変換してください。指定された方式の特徴を活かしながら、元の意味を正確に保って変換してください。\n\n${content}`;
    }
    
    return { systemPrompt, userPrompt };
}

module.exports = {
    buildClaudePrompts,
    buildGeminiPrompt,
    buildOpenAIPrompts
};