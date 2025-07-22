const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // koneksi mysql kamu

const AppSetting = sequelize.define('app_setting', {
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'app_setting',
    timestamps: true
});

module.exports = AppSetting;
