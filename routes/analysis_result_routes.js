const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const AnalysisResultController = require('../controllers/analysis_result.controller');

router.use(authMiddleware);
router.post('/', AnalysisResultController.createAnalysisResult);
router.get('/', AnalysisResultController.getAnalysisResults);
router.get('/:id', AnalysisResultController.getAnalysisResultById);
router.post('/analyze-text-pdf',AnalysisResultController.uploadPDF, AnalysisResultController.analyzeTextPDF);

module.exports = router;