import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/plans', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('plans').select('*').eq('is_active', true);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

router.get('/subscriptions', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', req.user!.id).order('created_at', { ascending: false }).limit(1).single();
    if (error) throw error;
    res.json(data || { status: 'TRIALING' });
  } catch (err) { next(err); }
});

router.post('/webhooks/stripe', async (req, res) => {
  res.json({ received: true });
});

export default router;
