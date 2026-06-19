import { Router } from 'express';
import { prisma } from '../index';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'siteforge-dev-secret-change-in-production';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-test-key' });

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

// POST /api/v1/ai/generate-site
router.post('/generate-site', authenticate, async (req: any, res, next) => {
  try {
    const { siteId, prompt, options } = req.body;
    
    const generation = await prisma.aiGeneration.create({
      data: {
        userId: req.user.sub,
        siteId,
        type: 'FULL_SITE',
        prompt: prompt || '',
        status: 'PROCESSING'
      }
    });
    
    // Process AI generation asynchronously
    process.nextTick(async () => {
      try {
        // Intent parsing with OpenAI
        const intentResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert business analyst. Parse the user prompt into a structured JSON object with fields: businessName, industry, location, services, targetAudience, tone, goals, requiredPages, requiredFeatures, brandPersonality. Respond ONLY with valid JSON.`
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2000
        });
        
        const intent = JSON.parse(intentResponse.choices[0].message.content || '{}');
        
        // Update site with parsed info
        await prisma.site.update({
          where: { id: siteId },
          data: {
            name: intent.businessName || 'Untitled Site',
            industry: intent.industry,
            location: intent.location,
            description: intent.goals
          }
        });
        
        // Generate pages based on intent
        const pages = intent.requiredPages || ['Home', 'About', 'Services', 'Contact'];
        for (let i = 0; i < pages.length; i++) {
          const pageName = pages[i];
          const slug = pageName.toLowerCase().replace(/\s+/g, '-');
          const existingPage = await prisma.page.findFirst({
            where: { siteId, name: pageName }
          });
          
          if (!existingPage) {
            await prisma.page.create({
              data: {
                siteId,
                name: pageName,
                slug: pageName === 'Home' ? '' : slug,
                path: pageName === 'Home' ? '/' : `/${slug}`,
                isHomePage: pageName === 'Home',
                sortOrder: i
              }
            });
          }
        }
        
        // Mark generation complete
        await prisma.aiGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'COMPLETED',
            output: intent,
            tokensUsed: intentResponse.usage?.total_tokens || 0,
            completedAt: new Date()
          }
        });
      } catch (error) {
        await prisma.aiGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          }
        });
      }
    });
    
    res.status(202).json({
      generationId: generation.id,
      status: 'PROCESSING',
      estimatedTime: 120
    });
  } catch (err) { next(err); }
});

// POST /api/v1/ai/rewrite
router.post('/rewrite', authenticate, async (req: any, res, next) => {
  try {
    const { text, tone, length } = req.body;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert copywriter. Rewrite the following text to be more engaging and professional. ${tone ? `Use a ${tone} tone.` : ''} ${length ? `Keep it approximately ${length} words.` : ''}`
        },
        { role: 'user', content: text }
      ],
      max_tokens: 1000
    });
    
    res.json({
      original: text,
      rewritten: response.choices[0].message.content || text
    });
  } catch (err) { next(err); }
});

// GET /api/v1/ai/generations/:id
router.get('/generations/:id', authenticate, async (req: any, res, next) => {
  try {
    const generation = await prisma.aiGeneration.findFirst({
      where: { id: req.params.id, userId: req.user.sub }
    });
    
    if (!generation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Generation not found' } });
    }
    
    res.json(generation);
  } catch (err) { next(err); }
});

export default router;
