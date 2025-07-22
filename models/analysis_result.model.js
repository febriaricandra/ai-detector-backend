const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // koneksi mysql kamu

const AnalysisResult = sequelize.define('AnalysisResult', {
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    flask_prediction: {
        type: DataTypes.STRING
    },
    flask_confidence: {
        type: DataTypes.JSON
    },
    gemini_analysis: {
        type: DataTypes.JSON
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'analysis_results',
    timestamps: true
});

module.exports = AnalysisResult;
