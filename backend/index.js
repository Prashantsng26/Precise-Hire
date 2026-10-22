import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload.js';
import screenRouter from './routes/screen.js';
import emailRouter from './routes/email.js';
import pipelineRouter from './routes/pipeline.js';
import { getDashboardStats } from './services/dynamoService.js';

const app = express();

// Note: Behind a reverse proxy (e.g. AWS ALB, Nginx, Vercel), app.set('trust proxy', 1) must be configured.

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://precise-hire-tau.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(helmet());

// Health route is defined before rate limiters to remain exempt from rate limiting
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PreciseHire API' }));

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, error: 'Too many requests, please try again later' });
  }
});
app.use(globalLimiter);

// Strict rate limiter: 10 requests per 15 minutes per IP
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, error: 'Too many requests, please try again later' });
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.post('/api/upload', strictLimiter);
app.use('/api/upload', uploadRouter);

app.post('/api/screen', strictLimiter);
app.use('/api/screen', screenRouter);

app.use('/api/email', strictLimiter, emailRouter);
app.use('/api/pipeline', pipelineRouter);

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
