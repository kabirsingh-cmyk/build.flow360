import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

router.post('/events', async (req, res) => {
  try {
    await supabase.from('analytics_events').insert(req.body);
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

router.get('/:siteId/analytics', async (req, res) => {
  res.json({ pageViews: 0, uniqueVisitors: 0, topPages: [] });
});

router.get('/:siteId/analytics/citations', async (req, res) => {
  res.json({ citations: 0, sources: [] });
});

export default router;
