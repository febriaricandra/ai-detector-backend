// Simple test untuk GPT service
require('dotenv').config();
const { analyzeTextWithGPT } = require('./services/gpt.service');

async function testGPT() {
    try {
        console.log('Testing GPT service...');
        console.log('Environment variables:');
        console.log('- GPT_MODEL:', process.env.GPT_MODEL);
        console.log('- GPT_MAX_RETRIES:', process.env.GPT_MAX_RETRIES);
        console.log('- GPT_TIMEOUT_DURATION:', process.env.GPT_TIMEOUT_DURATION);
        console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
        console.log('');

        const testText = "Penelitian ini bertujuan mengklasifikasikan tweet terkait pencemaran nama baik di Twitter menggunakan algoritma Support Vector Machine (SVM).";
        const testPrediction = "Dibuat oleh AI";
        const testConfidence = { ai: 0.9997, human: 0.0003 };

        const result = await analyzeTextWithGPT(testText, testPrediction, testConfidence);
        
        console.log('✅ GPT Analysis Success!');
        console.log('Response length:', result.analysis.length);
        console.log('First 200 chars:', result.analysis.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ GPT Analysis Failed:');
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
}

testGPT();
