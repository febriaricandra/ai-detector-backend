const AnalysisResult = require('../models/analysis_result.model');
const appSetting = require('../models/app_setting.model');
const { analyzeTextWithGemini } = require('../services/gemini.service');
const { analyzeTextWithGPT, getCacheStats, clearCache } = require('../services/gpt.service');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');


const upload = multer({ 
    dest: 'uploads/',
    limits: { 
        fileSize: 50 * 1024 * 1024, // Increase to 50MB
        files: 1
    },
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

        // Analisis GPT dengan timeout handling
        console.log('Starting GPT analysis for userId:', req.user.id);
        let gpt_analysis;
        let analysisStatus = 'success';
        
        try {
            gpt_analysis = await analyzeTextWithGPT(
                data,
                response.data.prediction,
                response.data.confidence
            );
            console.log('GPT analysis completed successfully for userId:', req.user.id);
        } catch (gptError) {
            console.warn('GPT analysis failed, using fallback for userId:', req.user.id, gptError.message);
            analysisStatus = 'fallback';
            
            // Generate fallback analysis
            gpt_analysis = {
                analysis: JSON.stringify({
                    linguistic_indicators: [{
                        pattern: "analisis_tidak_tersedia",
                        description: "Sistem GPT sementara tidak tersedia",
                        ai_likelihood: "tidak_diketahui",
                        examples: []
                    }],
                    vocabulary_analysis: {
                        complexity: "tidak dapat dianalisis",
                        technical_terms: [],
                        repetitive_phrases: [],
                        sentence_structure: "analisis tidak tersedia saat ini"
                    },
                    writing_style: {
                        formality: "tidak diketahui",
                        flow: "tidak diketahui",
                        coherence: "tidak diketahui",
                        human_markers: [],
                        ai_markers: []
                    },
                    conclusion: {
                        primary_reason: "Analisis GPT sementara tidak tersedia",
                        confidence_explanation: "Sistem sedang mengalami gangguan teknis",
                        recommendation: "Analisis dasar berdasarkan prediksi Flask saja"
                    }
                })
            };
        }

        // Simpan hasil analisis
        const analysisResult = await AnalysisResult.create({
            text: data,
            flask_prediction: response.data.prediction,
            flask_confidence: response.data.confidence,
            gemini_analysis: gpt_analysis, // Keep field name for backward compatibility
            userId: req.user.id
        });
        
        res.status(201).json({
            ...analysisResult.toJSON(),
            message: `Analysis completed ${analysisStatus === 'fallback' ? 'with fallback GPT analysis' : 'successfully'}`,
            gpt_status: analysisStatus
        });
    } catch (err) {
        console.error('Analysis Error:', err.message);
        
        // If Flask API failed, we can't continue
        if (err.response && err.response.status) {
            return res.status(502).json({ 
                message: 'Flask API service unavailable',
                error: 'FLASK_API_ERROR',
                details: err.response.data || err.message
            });
        }
        
        // For other errors (database, etc.)
        res.status(500).json({ 
            message: 'Analysis failed',
            error: 'INTERNAL_ERROR',
            details: err.message
        });
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
        console.log('Starting GPT analysis for PDF for userId:', req.user.id);
        let gpt_analysis;
        let analysisStatus = 'success';
        
        try {
            gpt_analysis = await analyzeTextWithGPT(
                extractedText,
                predictionResponse.data.prediction,
                predictionResponse.data.confidence
            );
            console.log('GPT analysis completed successfully for PDF for userId:', req.user.id);
        } catch (gptError) {
            console.warn('GPT analysis failed for PDF, using fallback for userId:', req.user.id, gptError.message);
            analysisStatus = 'fallback';
            
            // Generate fallback analysis
            gpt_analysis = {
                analysis: JSON.stringify({
                    linguistic_indicators: [{
                        pattern: "analisis_tidak_tersedia",
                        description: "Sistem GPT sementara tidak tersedia",
                        ai_likelihood: "tidak_diketahui",
                        examples: []
                    }],
                    vocabulary_analysis: {
                        complexity: "tidak dapat dianalisis",
                        technical_terms: [],
                        repetitive_phrases: [],
                        sentence_structure: "analisis tidak tersedia saat ini"
                    },
                    writing_style: {
                        formality: "tidak diketahui",
                        flow: "tidak diketahui",
                        coherence: "tidak diketahui",
                        human_markers: [],
                        ai_markers: []
                    },
                    conclusion: {
                        primary_reason: "Analisis GPT sementara tidak tersedia",
                        confidence_explanation: "Sistem sedang mengalami gangguan teknis",
                        recommendation: "Analisis dasar berdasarkan prediksi Flask saja"
                    }
                })
            };
        }

        // Simpan hasil analisis
        const analysisResult = await AnalysisResult.create({
            text: extractedText,
            flask_prediction: predictionResponse.data.prediction,
            flask_confidence: predictionResponse.data.confidence,
            gemini_analysis: gpt_analysis, // Keep field name for backward compatibility
            userId: req.user.id
        });
        
        res.status(201).json({
            ...analysisResult.toJSON(),
            message: `PDF analysis completed ${analysisStatus === 'fallback' ? 'with fallback GPT analysis' : 'successfully'}`,
            gpt_status: analysisStatus
        });
    } catch (err) {
        console.error('PDF Analysis Error:', err.response?.data || err.message);
        
        // Cleanup file jika terjadi error dan file masih ada
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.error('Failed to delete temp file:', unlinkErr);
            }
        }
        
        // Provide more specific error messages
        if (err.response?.status === 413 || err.message.includes('file too large')) {
            res.status(413).json({ 
                message: 'PDF file too large (max 50MB)',
                error: 'FILE_TOO_LARGE'
            });
        } else if (err.response && err.response.status) {
            res.status(502).json({ 
                message: 'Flask API service unavailable for PDF processing',
                error: 'FLASK_PDF_ERROR',
                details: err.response.data || err.message
            });
        } else {
            res.status(500).json({ 
                message: 'PDF analysis failed',
                error: 'INTERNAL_ERROR',
                details: err.message
            });
        }
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

exports.deleteAnalysisResult = async (req, res) => {
    const { id } = req.params;
    try {
        const analysisResult = await AnalysisResult.findOne({
            where: { id, userId: req.user.id }
        });
        
        if (!analysisResult) {
            return res.status(404).json({ message: 'Analysis result not found' });
        }
        
        await analysisResult.destroy();
        res.json({ 
            message: 'Analysis result deleted successfully',
            deletedId: id
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Health check endpoint untuk monitoring GPT service
exports.getGPTHealthCheck = async (req, res) => {
    try {
        const cacheStats = getCacheStats();
        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            cache: cacheStats,
            uptime: process.uptime() + ' seconds'
        };
        res.json(healthInfo);
    } catch (err) {
        res.status(500).json({ 
            status: 'unhealthy',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Clear cache endpoint untuk admin
exports.clearGPTCache = async (req, res) => {
    try {
        clearCache();
        res.json({ 
            message: 'GPT cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to clear cache',
            error: err.message
        });
    }
}

// Export multer upload middleware
exports.uploadPDF = upload.single('file');