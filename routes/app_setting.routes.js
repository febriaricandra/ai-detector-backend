const express = require('express');
const router = express.Router();

const AppSettingController = require('../controllers/app_setting.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', AppSettingController.getAppSettings);
router.get('/:key', AppSettingController.getAppSettingByKey);
router.post('/', AppSettingController.createAppSetting);
router.put('/:key', AppSettingController.updateAppSetting);

module.exports = router;