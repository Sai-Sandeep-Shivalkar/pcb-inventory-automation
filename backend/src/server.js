const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

dotenv.config();

const app = express();

fs.mkdirSync(path.join(process.cwd(), 'tmp_uploads'), { recursive: true });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/components', require('./routes/componentRoutes'));
app.use('/api/pcb', require('./routes/pcbRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/excel', require('./routes/excelRoutes'));

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
