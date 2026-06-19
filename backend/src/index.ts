import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import siteRoutes from './routes/sites';
import pageRoutes from './routes/pages';
import sectionRoutes from './routes/sections';
import aiRoutes from './routes/ai';
import aeoRoutes from './routes/aeo';
import assetRoutes from './routes/assets';
import analyticsRoutes from './routes/analytics';
import billingRoutes from './routes/billing';
import templateRoutes from './routes/templates';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sites', siteRoutes);
app.use('/api/v1/sites', pageRoutes);
app.use('/api/v1/sites', sectionRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/sites', aeoRoutes);
app.use('/api/v1/sites', assetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', billingRoutes);
app.use('/api/v1/templates', templateRoutes);

// Error handling
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong!',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((_req: any, res: any) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SiteForge API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
