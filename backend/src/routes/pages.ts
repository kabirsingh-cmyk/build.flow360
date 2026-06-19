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

// GET /api/v1/sites/:siteId/pages
router.get('/:siteId/pages', authenticate, async (req: any, res, next) => {
  try {
    const pages = await prisma.page.findMany({
      where: { siteId: req.params.siteId },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(pages);
  } catch (err) { next(err); }
});

// POST /api/v1/sites/:siteId/pages
router.post('/:siteId/pages', authenticate, async (req: any, res, next) => {
  try {
    const { name, slug, isHomePage } = req.body;
    const page = await prisma.page.create({
      data: {
        siteId: req.params.siteId,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        path: slug ? `/${slug}` : '/',
        isHomePage: isHomePage || false
      }
    });
    res.status(201).json(page);
  } catch (err) { next(err); }
});

// GET /api/v1/sites/:siteId/pages/:id
router.get('/:siteId/pages/:id', authenticate, async (req: any, res, next) => {
  try {
    const page = await prisma.page.findFirst({
      where: { id: req.params.id, siteId: req.params.siteId },
      include: { sections: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!page) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found' } });
    res.json(page);
  } catch (err) { next(err); }
});

// PATCH /api/v1/sites/:siteId/pages/:id
router.patch('/:siteId/pages/:id', authenticate, async (req: any, res, next) => {
  try {
    const page = await prisma.page.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(page);
  } catch (err) { next(err); }
});

// DELETE /api/v1/sites/:siteId/pages/:id
router.delete('/:siteId/pages/:id', authenticate, async (req: any, res, next) => {
  try {
    await prisma.page.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
