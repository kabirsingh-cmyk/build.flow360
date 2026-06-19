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

// GET /api/v1/sites/:siteId/aeo/config
router.get('/:siteId/aeo/config', authenticate, async (req: any, res, next) => {
  try {
    const aeoConfig = await prisma.aeoConfig.findFirst({
      where: { site: { id: req.params.siteId } }
    });
    res.json(aeoConfig);
  } catch (err) { next(err); }
});

// PATCH /api/v1/sites/:siteId/aeo/config
router.patch('/:siteId/aeo/config', authenticate, async (req: any, res, next) => {
  try {
    const aeoConfig = await prisma.aeoConfig.updateMany({
      where: { site: { id: req.params.siteId } },
      data: req.body
    });
    res.json(aeoConfig);
  } catch (err) { next(err); }
});

// GET /api/v1/sites/:siteId/aeo/schema
router.get('/:siteId/aeo/schema', authenticate, async (req: any, res, next) => {
  try {
    const schemas = await prisma.schemaMarkup.findMany({
      where: { siteId: req.params.siteId }
    });
    res.json(schemas);
  } catch (err) { next(err); }
});

// POST /api/v1/sites/:siteId/aeo/schema - Regenerate schema
router.post('/:siteId/aeo/schema', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId },
      include: { pages: true, aeoConfig: true }
    });
    
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    
    // Generate Organization schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `https://${site.slug}.siteforge.ai/#organization`,
      name: site.aeoConfig?.orgName || site.name,
      url: `https://${site.slug}.siteforge.ai`,
      description: site.description || '',
      sameAs: site.aeoConfig?.orgSameAs || []
    };
    
    await prisma.schemaMarkup.upsert({
      where: { id: `${site.id}-org` },
      create: {
        id: `${site.id}-org`,
        siteId: site.id,
        type: 'ORGANIZATION',
        jsonLd: JSON.stringify(orgSchema),
        isValid: true
      },
      update: {
        jsonLd: JSON.stringify(orgSchema),
        isValid: true
      }
    });
    
    // Generate LocalBusiness schema if applicable
    if (site.aeoConfig?.businessType) {
      const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': site.aeoConfig.businessType,
        name: site.aeoConfig.orgName || site.name,
        address: site.aeoConfig.address,
        geo: site.aeoConfig.geoCoordinates,
        telephone: site.aeoConfig.telephone,
        email: site.aeoConfig.email,
        openingHours: site.aeoConfig.openingHours,
        priceRange: site.aeoConfig.priceRange
      };
      
      await prisma.schemaMarkup.upsert({
        where: { id: `${site.id}-local` },
        create: {
          id: `${site.id}-local`,
          siteId: site.id,
          type: 'LOCALBUSINESS',
          jsonLd: JSON.stringify(localBusinessSchema),
          isValid: true
        },
        update: {
          jsonLd: JSON.stringify(localBusinessSchema),
          isValid: true
        }
      });
    }
    
    // Generate page-specific schemas
    for (const page of site.pages) {
      if (page.schemaType) {
        const pageSchema = {
          '@context': 'https://schema.org',
          '@type': page.schemaType,
          name: page.name,
          description: page.metaDescription
        };
        
        await prisma.schemaMarkup.upsert({
          where: { id: `${site.id}-${page.id}` },
          create: {
            id: `${site.id}-${page.id}`,
            siteId: site.id,
            pageId: page.id,
            type: page.schemaType,
            jsonLd: JSON.stringify(pageSchema),
            isValid: true
          },
          update: {
            jsonLd: JSON.stringify(pageSchema),
            isValid: true
          }
        });
      }
    }
    
    res.json({ success: true, schemasGenerated: site.pages.length + 1 });
  } catch (err) { next(err); }
});

// GET /api/v1/sites/:siteId/aeo/score
router.get('/:siteId/aeo/score', authenticate, async (req: any, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId },
      include: { pages: { include: { sections: true } }, schemaMarkup: true }
    });
    
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    
    // Calculate scores
    const hasOrgSchema = site.schemaMarkup.some(s => s.type === 'ORGANIZATION');
    const hasLocalSchema = site.schemaMarkup.some(s => s.type === 'LOCALBUSINESS');
    const hasFaqSchema = site.schemaMarkup.some(s => s.type === 'FAQPAGE');
    const hasBlogSchema = site.schemaMarkup.some(s => s.type === 'BLOGPOSTING');
    const hasAeoSections = site.pages.some(p => p.sections.some(s => s.isAeoOptimized));
    const daysSinceUpdate = Math.floor((Date.now() - site.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const schemaScore = Math.min(25, (hasOrgSchema ? 5 : 0) + (hasLocalSchema ? 5 : 0) + (hasFaqSchema ? 5 : 0) + (hasBlogSchema ? 3 : 0) + (site.schemaMarkup.some(s => s.type === 'BREADCRUMBLIST') ? 3 : 0) + 4);
    const contentScore = Math.min(25, (hasAeoSections ? 8 : 0) + (site.pages.some(p => p.sections.some(s => s.type === 'FAQ')) ? 5 : 0) + 12);
    const speedScore = 20; // Placeholder - would be measured
    const freshnessScore = daysSinceUpdate < 30 ? 15 : daysSinceUpdate < 90 ? 12 : daysSinceUpdate < 180 ? 8 : 5;
    const mobileScore = 15; // All responsive by default
    
    const overall = schemaScore + contentScore + speedScore + freshnessScore + mobileScore;
    
    // Update site's AEO score
    await prisma.site.update({
      where: { id: site.id },
      data: { aeoScore: overall }
    });
    
    res.json({
      overall,
      breakdown: {
        schema: schemaScore,
        content: contentScore,
        speed: speedScore,
        freshness: freshnessScore,
        mobile: mobileScore
      },
      recommendations: [
        ...(!hasFaqSchema ? [{ priority: 'high', category: 'schema', message: 'Add FAQPage schema to your FAQ sections', action: 'generate-faq' }] : []),
        ...(!hasAeoSections ? [{ priority: 'medium', category: 'content', message: 'Optimize your content for AI answer engines', action: 'optimize-content' }] : [])
      ],
      lastUpdated: site.updatedAt.toISOString()
    });
  } catch (err) { next(err); }
});

export default router;
