const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// Get authenticated user profile
router.get('/profile', authMiddleware, userController.getAuthenticatedUser);
router.put('/profile', authMiddleware, userController.editProfile);

module.exports = router;