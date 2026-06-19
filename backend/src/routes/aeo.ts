import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateAllSchema, calculateAeoScore, generateAllAeoFiles, runAeoAudit } from '../services/aeoEngine';

const router = Router({ mergeParams: true });

router.get('/:siteId/aeo/config', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('aeo_configs').select('*').eq('site_id', req.params.siteId).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.patch('/:siteId/aeo/config', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('aeo_configs').update(req.body).eq('site_id', req.params.siteId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/:siteId/aeo/schema', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('schema_markup').select('*').eq('site_id', req.params.siteId);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/:siteId/aeo/schema', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    const result = await generateAllSchema(site);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:siteId/aeo/score', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    const score = await calculateAeoScore(site);
    res.json(score);
  } catch (err) { next(err); }
});

router.get('/:siteId/aeo/sitemap', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    const files = await generateAllAeoFiles(site);
    res.setHeader('Content-Type', 'application/xml');
    res.send(files.sitemap);
  } catch (err) { next(err); }
});

router.get('/:siteId/aeo/robots', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    const files = await generateAllAeoFiles(site);
    res.setHeader('Content-Type', 'text/plain');
    res.send(files.robots);
  } catch (err) { next(err); }
});

router.get('/:siteId/aeo/llms-txt', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.siteId).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    const files = await generateAllAeoFiles(site);
    res.setHeader('Content-Type', 'text/plain');
    res.send(files.llmsTxt);
  } catch (err) { next(err); }
});

router.post('/:siteId/aeo/audit', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await runAeoAudit(req.params.siteId);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
