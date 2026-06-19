import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'siteforge-dev-secret-change-in-production';

// Auth middleware
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

const createSiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional()
  }).optional(),
  brandFonts: z.object({
    heading: z.string().optional(),
    body: z.string().optional()
  }).optional()
});

// Generate unique slug
const generateSlug = (name: string) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 7)}`;
};

// GET /api/v1/sites - List user's sites
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const sites = await prisma.site.findMany({
      where: { ownerId: req.user.sub },
      include: {
        pages: { select: { id: true, name: true, slug: true } },
        domains: { select: { domain: true, isPrimary: true } },
        _count: { select: { pages: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(sites);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sites - Create a new site
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const data = createSiteSchema.parse(req.body);
    const slug = generateSlug(data.name);
    
    const site = await prisma.site.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        industry: data.industry,
        location: data.location,
        brandColors: data.brandColors || { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937' },
        brandFonts: data.brandFonts || { heading: 'Inter', body: 'Inter' },
        ownerId: req.user.sub,
        aeoConfig: {
          create: {
            orgName: data.name,
            contentTone: 'professional'
          }
        }
      },
      include: {
        pages: true,
        aeoConfig: true
      }
    });
    
    // Create default home page
    await prisma.page.create({
      data: {
        siteId: site.id,
        name: 'Home',
        slug: '',
        path: '/',
        isHomePage: true,
        sortOrder: 0
      }
    });
    
    res.status(201).json(site);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sites/:id - Get site details
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, ownerId: req.user.sub },
      include: {
        pages: {
          include: { sections: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' }
        },
        domains: true,
        aeoConfig: true,
        assets: true
      }
    });
    
    if (!site) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    
    res.json(site);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/sites/:id - Update site
router.patch('/:id', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.updateMany({
      where: { id: req.params.id, ownerId: req.user.sub },
      data: req.body
    });
    
    if (site.count === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    
    const updated = await prisma.site.findUnique({
      where: { id: req.params.id },
      include: { pages: true, aeoConfig: true }
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/sites/:id - Delete site
router.delete('/:id', authenticate, async (req: any, res, next) => {
  try {
    await prisma.site.deleteMany({
      where: { id: req.params.id, ownerId: req.user.sub }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sites/:id/generate - AI generate site
router.post('/:id/generate', authenticate, async (req: any, res, next) => {
  try {
    const { prompt, options } = req.body;
    
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, ownerId: req.user.sub }
    });
    
    if (!site) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    
    // Create AI generation record
    const generation = await prisma.aiGeneration.create({
      data: {
        userId: req.user.sub,
        siteId: site.id,
        type: 'FULL_SITE',
        prompt: prompt || `Generate a professional website for ${site.name}`,
        status: 'PENDING'
      }
    });
    
    res.status(202).json({
      generationId: generation.id,
      status: 'PENDING',
      estimatedTime: 120,
      streamUrl: `/api/v1/ai/generations/${generation.id}/stream`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sites/:id/publish - Publish site
router.post('/:id/publish', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, ownerId: req.user.sub },
      include: { pages: { include: { sections: true } } }
    });
    
    if (!site) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    
    const deployment = await prisma.deployment.create({
      data: {
        siteId: site.id,
        version: `v-${Date.now()}`,
        status: 'PENDING',
        liveUrl: `https://${site.slug}.siteforge.ai`
      }
    });
    
    // Update site status
    await prisma.site.update({
      where: { id: site.id },
      data: { status: 'PUBLISHED', lastPublishedAt: new Date() }
    });
    
    res.json({
      deploymentId: deployment.id,
      status: 'PENDING',
      url: deployment.liveUrl
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sites/:id/export - Export site code
router.post('/:id/export', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, ownerId: req.user.sub },
      include: { pages: { include: { sections: true } } }
    });
    
    if (!site) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    }
    
    res.json({
      site,
      exportUrl: `/api/v1/sites/${site.id}/export/download`,
      format: req.body.format || 'html'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
