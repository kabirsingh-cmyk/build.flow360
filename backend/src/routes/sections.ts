import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/:siteId/pages/:pageId/sections', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('sections').select('*').eq('page_id', req.params.pageId).order('sort_order');
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/:siteId/pages/:pageId/sections', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { type, name, config, styles } = req.body;
    const { count } = await supabase.from('sections').select('*', { count: 'exact', head: true }).eq('page_id', req.params.pageId);
    const { data, error } = await supabase.from('sections').insert({
      page_id: req.params.pageId,
      type,
      name: name || type,
      config: config || {},
      styles: styles || {},
      sort_order: count || 0
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch('/:siteId/pages/:pageId/sections/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('sections').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:siteId/pages/:pageId/sections/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supabase.from('sections').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
