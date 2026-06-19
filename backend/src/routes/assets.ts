import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.post('/:siteId/assets', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.status(201).json({ id: 'asset_' + Date.now(), url: 'https://picsum.photos/800/600', message: 'Asset upload stub' });
});

router.get('/:siteId/assets', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabase.from('assets').select('*').eq('site_id', req.params.siteId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.delete('/:siteId/assets/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  await supabase.from('assets').delete().eq('id', req.params.id);
  res.json({ success: true });
});

export default router;
