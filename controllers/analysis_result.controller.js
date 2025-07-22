const AnalysisResult = require('../models/analysis_result.model');
const appSetting = require('../models/app_setting.model');
const { analyzeTextWithGemini } = require('../services/gemini.service');
const { analyzeTextWithGPT } = require('../services/gpt.service');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');


const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

exports.createAnalysisResult = async (req, res) => {
    const { data } = req.body;
    try {
        // Ambil URL Flask API dari appSetting jika sudah tersedia
        const flaskApiUrl = await appSetting.findOne({ where: { key: 'flask_api_url' } });
        const apiUrl = flaskApiUrl ? flaskApiUrl.value : 'default';

        // Request ke Flask API dengan axios
        const response = await axios.post(apiUrl + '/predict', { text: data }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Analisis Gemini
        // const gemini_analysis = await analyzeTextWithGemini(
        //     data,
        //     response.data.prediction,
        //     response.data.confidence
        // );

        // Analisis GPT
        const gpt_analysis = await analyzeTextWithGPT(
            data,
            response.data.prediction,
            response.data.confidence
        );

        console.log('userId', req.user.id);

        // Simpan hasil analisis
        const analysisResult = await AnalysisResult.create({
            text: data,
            flask_prediction: response.data.prediction,
            flask_confidence: response.data.confidence,
            gemini_analysis: gpt_analysis,
            userId: req.user.id
        });
        res.status(201).json(analysisResult);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};




exports.analyzeTextPDF = async (req, res) => {
    console.log('File received:', req.file);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    
    const file = req.file; // File PDF yang diupload

    if (!file) {
        console.log('No file found in req.file');
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Baca file PDF
        const fileBuffer = fs.readFileSync(file.path);
        
        // Ambil URL Flask API dari appSetting jika sudah tersedia
        const flaskApiUrl = await appSetting.findOne({ where: { key: 'flask_api_url' } });
        const apiUrl = flaskApiUrl ? flaskApiUrl.value : 'default';

        // Buat FormData untuk mengirim file ke Flask
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Append file buffer dengan nama dan mimetype yang benar
        formData.append('file', fileBuffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // Request ke Flask API untuk extract text dari PDF
        const extractResponse = await axios.post(apiUrl + '/extract_abstract1', formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Hapus file setelah berhasil dikirim
        fs.unlinkSync(file.path);

        // Ambil teks yang sudah diekstrak
        const extractedText = extractResponse.data.abstract;

        // Request ke Flask API untuk prediksi dengan teks yang sudah diekstrak
        const predictionResponse = await axios.post(apiUrl + '/predict', { 
            text: extractedText 
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Analisis GPT dengan teks yang sudah diekstrak
        const gpt_analysis = await analyzeTextWithGPT(
            extractedText,
            predictionResponse.data.prediction,
            predictionResponse.data.confidence
        );

        console.log('userId', req.user.id);

        // Simpan hasil analisis
        const analysisResult = await AnalysisResult.create({
            text: extractedText,
            flask_prediction: predictionResponse.data.prediction,
            flask_confidence: predictionResponse.data.confidence,
            gemini_analysis: gpt_analysis,
            userId: req.user.id
        });
        
        res.status(201).json(analysisResult);
    } catch (err) {
        console.error('Error details:', err.response?.data || err.message);
        
        // Cleanup file jika terjadi error dan file masih ada
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.error('Failed to delete temp file:', unlinkErr);
            }
        }
        res.status(500).json({ message: err.message });
    }
};

exports.getAnalysisResults = async (req, res) => {
    try {
        const analysisResults = await AnalysisResult.findAll({
            where: { userId: req.user.id }
        });
        res.json(analysisResults);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getAnalysisResultById = async (req, res) => {
    const { id } = req.params;
    try {
        const analysisResult = await AnalysisResult.findOne({
            where: { id, userId: req.user.id }
        });
        if (!analysisResult) {
            return res.status(404).json({ message: 'Analysis result not found' });
        }
        res.json(analysisResult);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Export multer upload middleware
exports.uploadPDF = upload.single('file');