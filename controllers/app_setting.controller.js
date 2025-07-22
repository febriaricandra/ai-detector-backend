const AppSetting = require('../models/app_setting.model');

exports.getAppSettings = async (req, res) => {
    try {
        const settings = await AppSetting.findAll();
        res.json(settings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAppSettingByKey = async (req, res) => {
    const { key } = req.params;
    try {
        const setting = await AppSetting.findOne({ where: { key } });
        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json(setting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.createAppSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        const setting = await AppSetting.create({ key, value });
        res.status(201).json(setting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.updateAppSetting = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
        const setting = await AppSetting.findOne({ where: { key } });
        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        setting.value = value;
        await setting.save();
        res.json(setting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}