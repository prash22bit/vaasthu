import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'VastuPlan API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.connected,
        host: dbStatus.host,
      },
    },
  });
});

export default router;
