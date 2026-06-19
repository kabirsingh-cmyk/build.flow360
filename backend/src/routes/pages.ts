import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/:siteId/pages', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('pages').select('*, sections:sections(*)').eq('site_id', req.params.siteId).order('sort_order');
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/:siteId/pages', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, slug } = req.body;
    const { data, error } = await supabase.from('pages').insert({
      site_id: req.params.siteId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      path: slug ? `/${slug}` : '/'
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch('/:siteId/pages/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('pages').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:siteId/pages/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supabase.from('pages').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
