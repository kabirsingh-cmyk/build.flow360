import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateFullSite } from '../services/aiService';

const router = Router();

// List user's sites
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*, pages:pages(id, name, slug), domains:domains(domain, isPrimary)')
      .eq('owner_id', req.user!.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(sites || []);
  } catch (err) { next(err); }
});

// Create site
router.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, description, industry, location } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);
    
    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        name,
        slug,
        description,
        industry,
        location,
        owner_id: req.user!.id,
        brand_colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937' },
        brand_fonts: { heading: 'Inter', body: 'Inter' }
      })
      .select()
      .single();
    if (error) throw error;

    // Create default home page
    await supabase.from('pages').insert({
      site_id: site.id,
      name: 'Home',
      slug: '',
      path: '/',
      is_home_page: true,
      sort_order: 0
    });

    // Create AEO config
    await supabase.from('aeo_configs').insert({
      org_name: name,
      content_tone: 'professional'
    });

    res.status(201).json(site);
  } catch (err) { next(err); }
});

// Get single site
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site, error } = await supabase
      .from('sites')
      .select('*, pages:pages(*, sections:sections(*)), aeo_config:aeo_configs(*), domains:domains(*)')
      .eq('id', req.params.id)
      .eq('owner_id', req.user!.id)
      .single();
    if (error || !site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });
    res.json(site);
  } catch (err) { next(err); }
});

// Update site
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('owner_id', req.user!.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// Delete site
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await supabase.from('sites').delete().eq('id', req.params.id).eq('owner_id', req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// AI Generate site
router.post('/:id/generate', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { prompt } = req.body;
    const { data: site } = await supabase.from('sites').select('*').eq('id', req.params.id).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });

    // Track AI generation
    await supabase.from('ai_generations').insert({
      user_id: req.user!.id,
      site_id: req.params.id,
      type: 'FULL_SITE',
      prompt: prompt || '',
      status: 'PROCESSING'
    });

    // Process asynchronously
    process.nextTick(async () => {
      try {
        await generateFullSite(req.params.id, prompt);
        await supabase.from('sites').update({ status: 'DRAFT' }).eq('id', req.params.id);
      } catch (e) {
        console.error('AI generation failed:', e);
      }
    });

    res.status(202).json({ generationId: req.params.id, status: 'PROCESSING', estimatedTime: 120 });
  } catch (err) { next(err); }
});

// Publish site
router.post('/:id/publish', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: site } = await supabase.from('sites').select('*, pages:pages(*, sections:sections(*))').eq('id', req.params.id).single();
    if (!site) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Site not found' } });

    await supabase.from('sites').update({ status: 'PUBLISHED', last_published_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ url: `https://${site.slug}.siteforge.ai` });
  } catch (err) { next(err); }
});

export default router;
