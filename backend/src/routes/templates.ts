import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/', async (_req, res) => {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(templates);
});

router.get('/:slug', async (req, res) => {
  const template = await prisma.template.findUnique({
    where: { slug: req.params.slug }
  });
  if (!template) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Template not found' } });
  }
  res.json(template);
});

export default router;
