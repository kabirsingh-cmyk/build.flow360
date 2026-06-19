import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/plans', async (_req, res) => {
  const plans = await prisma.plan.findMany({ where: { isActive: true } });
  res.json(plans);
});

router.get('/subscriptions', async (req, res) => {
  res.json({ status: 'TRIALING' });
});

router.post('/subscriptions', async (req, res) => {
  res.status(201).json({ status: 'ACTIVE' });
});

router.post('/webhooks/stripe', async (req, res) => {
  res.json({ received: true });
});

export default router;
