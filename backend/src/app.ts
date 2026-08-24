import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import projectRoutes from './routes/projectRoutes';
import healthRoutes from './routes/healthRoutes';
import aiRoutes from './routes/aiRoutes';

export function createApp(): Application {
  const app = express();

  // -------------------------------------------------------------------------
  // Security middleware
  // -------------------------------------------------------------------------
  app.use(helmet());

  // -------------------------------------------------------------------------
  // CORS
  // -------------------------------------------------------------------------
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., server-to-server, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // -------------------------------------------------------------------------
  // Request parsing
  // -------------------------------------------------------------------------
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // -------------------------------------------------------------------------
  // Logging
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // -------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------
  app.use('/api/health', healthRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/ai', aiRoutes);

  // -------------------------------------------------------------------------
  // Error handling (must be last)
  // -------------------------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
