import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateFullSite, rewriteText, generateFaqBlock } from '../services/aiService';

const router = Router();

router.post('/generate-site', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { siteId, prompt } = req.body;
    const { data: site } = await supabase.from('sites').select('*').eq('id', siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });

    await supabase.from('ai_generations').insert({
      user_id: req.user!.id,
      site_id: siteId,
      type: 'FULL_SITE',
      prompt: prompt || '',
      status: 'PROCESSING'
    });

    process.nextTick(async () => {
      try { await generateFullSite(siteId, prompt); }
      catch (e) { console.error('AI generation failed:', e); }
    });

    res.status(202).json({ generationId: siteId, status: 'PROCESSING', estimatedTime: 120 });
  } catch (err) { next(err); }
});

router.post('/rewrite', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { text, tone } = req.body;
    const rewritten = await rewriteText(text, tone);
    res.json({ original: text, rewritten });
  } catch (err) { next(err); }
});

router.post('/generate-faq', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { topic, count } = req.body;
    const faqs = await generateFaqBlock(topic, count || 3);
    res.json({ faqs });
  } catch (err) { next(err); }
});

router.get('/generations/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('ai_generations').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Generation not found' } });
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
