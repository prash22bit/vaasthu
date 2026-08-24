import { Router } from 'express';
import { chat } from '../controllers/aiController';

const router = Router();

// POST /api/ai/chat — Main AI chat and proposal generation endpoint
router.post('/chat', chat);

export default router;
