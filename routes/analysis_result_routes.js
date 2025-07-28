const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const AnalysisResultController = require('../controllers/analysis_result.controller');

router.use(authMiddleware);
router.post('/', AnalysisResultController.createAnalysisResult);
router.get('/', AnalysisResultController.getAnalysisResults);
router.get('/:id', AnalysisResultController.getAnalysisResultById);
router.post('/analyze-text-pdf',AnalysisResultController.uploadPDF, AnalysisResultController.analyzeTextPDF);

// Monitoring endpoints
router.get('/health/gpt', AnalysisResultController.getGPTHealthCheck);
router.post('/cache/clear', AnalysisResultController.clearGPTCache);

module.exports = router;