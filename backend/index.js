import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload.js';
import screenRouter from './routes/screen.js';
import emailRouter from './routes/email.js';
import pipelineRouter from './routes/pipeline.js';
import { getDashboardStats } from './services/dynamoService.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/screen', screenRouter);
app.use('/api/email', emailRouter);
app.use('/api/pipeline', pipelineRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PreciseHire API' }));
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({ success: true, ...stats });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`PreciseHire backend running on port ${PORT}`);
});
server.timeout = 600000;
