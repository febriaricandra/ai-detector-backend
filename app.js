const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());


app.use('/api/', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/analysis-results', require('./routes/analysis_result_routes'));
app.use('/api/app-settings', require('./routes/app_setting.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
