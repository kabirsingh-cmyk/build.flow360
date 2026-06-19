import { Router } from 'express';
import { prisma } from '../index';
import jwt from 'jsonwebtoken';

const router = Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET || 'siteforge-dev-secret-change-in-production';

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

router.post('/:siteId/assets', authenticate, async (req: any, res) => {
  res.status(201).json({ id: 'asset_123', url: 'https://cdn.siteforge.ai/placeholder.jpg', message: 'Asset upload stub' });
});

router.get('/:siteId/assets', authenticate, async (req: any, res) => {
  res.json([]);
});

router.delete('/:siteId/assets/:id', authenticate, async (req: any, res) => {
  res.json({ success: true });
});

export default router;
