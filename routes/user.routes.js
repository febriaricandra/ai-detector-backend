const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// Get authenticated user profile
router.use(authMiddleware);
router.get('/profile', userController.getAuthenticatedUser);
router.put('/profile', userController.editProfile);

module.exports = router;