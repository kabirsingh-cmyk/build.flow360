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

// GET /api/v1/sites/:siteId/pages/:pageId/sections
router.get('/:siteId/pages/:pageId/sections', authenticate, async (req: any, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      where: { pageId: req.params.pageId },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(sections);
  } catch (err) { next(err); }
});

// POST /api/v1/sites/:siteId/pages/:pageId/sections
router.post('/:siteId/pages/:pageId/sections', authenticate, async (req: any, res, next) => {
  try {
    const { type, name, config, styles } = req.body;
    const section = await prisma.section.create({
      data: {
        pageId: req.params.pageId,
        type,
        name: name || type,
        config: config || {},
        styles: styles || {}
      }
    });
    res.status(201).json(section);
  } catch (err) { next(err); }
});

// PATCH /api/v1/sites/:siteId/pages/:pageId/sections/:id
router.patch('/:siteId/pages/:pageId/sections/:id', authenticate, async (req: any, res, next) => {
  try {
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(section);
  } catch (err) { next(err); }
});

// DELETE /api/v1/sites/:siteId/pages/:pageId/sections/:id
router.delete('/:siteId/pages/:pageId/sections/:id', authenticate, async (req: any, res, next) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/sites/:siteId/pages/:pageId/sections/:id/reorder
router.post('/:siteId/pages/:pageId/sections/:id/reorder', authenticate, async (req: any, res, next) => {
  try {
    const { newIndex } = req.body;
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: { sortOrder: newIndex }
    });
    res.json(section);
  } catch (err) { next(err); }
});

export default router;
