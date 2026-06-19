import { supabase } from '../lib/supabase';
import { chatCompletion } from '../lib/openrouter';

export async function generateOrganizationSchema(site: any, aeoConfig: any): Promise<string> {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `https://${site.slug}.siteforge.ai/#organization`,
    name: aeoConfig?.org_name || site.name,
    url: `https://${site.slug}.siteforge.ai`,
    logo: aeoConfig?.org_logo_url || '',
    description: aeoConfig?.org_description || site.description || '',
    sameAs: aeoConfig?.org_same_as || []
  };
  return JSON.stringify(schema, null, 2);
}

export async function generateLocalBusinessSchema(site: any, aeoConfig: any): Promise<string> {
  const schema = {
    '@context': 'https://schema.org',
    '@type': aeoConfig?.business_type || 'LocalBusiness',
    '@id': `https://${site.slug}.siteforge.ai/#localbusiness`,
    name: aeoConfig?.org_name || site.name,
    image: aeoConfig?.org_logo_url || '',
    description: aeoConfig?.org_description || site.description || '',
    address: aeoConfig?.address || {},
    geo: aeoConfig?.geo_coordinates || {},
    telephone: aeoConfig?.telephone || '',
    email: aeoConfig?.email || '',
    priceRange: aeoConfig?.price_range || '$$',
    openingHours: aeoConfig?.opening_hours || []
  };
  return JSON.stringify(schema, null, 2);
}

export async function generateFaqPageSchema(page: any, sections: any[]): Promise<string> {
  const faqSection = sections.find((s: any) => s.type === 'FAQ');
  if (!faqSection) return '';
  const items = faqSection.config?.items || [];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item: any) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
  return JSON.stringify(schema, null, 2);
}

export function generateSitemap(site: any, pages: any[]): string {
  const baseUrl = `https://${site.slug}.siteforge.ai`;
  const urls = pages.map((p: any) => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${p.is_home_page ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p.is_home_page ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateRobotsTxt(site: any): string {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: GPTBot
Allow: /
Disallow: /admin/

User-agent: ClaudeBot
Allow: /
Disallow: /admin/

User-agent: PerplexityBot
Allow: /
Disallow: /admin/

User-agent: CCBot
Allow: /
Disallow: /admin/

Sitemap: https://${site.slug}.siteforge.ai/sitemap.xml`;
}

export function generateLlmsTxt(site: any, aeoConfig: any, pages: any[]): string {
  const baseUrl = `https://${site.slug}.siteforge.ai`;
  const pageLinks = pages.map((p: any) => `- [${p.name}](${baseUrl}${p.path})`).join('\n');
  return `# ${aeoConfig?.org_name || site.name}

## About
${aeoConfig?.org_description || site.description || 'A professional business website.'}

## Services
${(aeoConfig?.target_keywords || []).map((k: string) => `- ${k}`).join('\n')}

## Pages
${pageLinks}

## Contact
${aeoConfig?.telephone ? `- Phone: ${aeoConfig.telephone}` : ''}
${aeoConfig?.email ? `- Email: ${aeoConfig.email}` : ''}
${site.location ? `- Location: ${site.location}` : ''}
`;
}

export async function calculateAeoScore(site: any): Promise<any> {
  const { data: pages } = await supabase.from('pages').select('*, sections:sections(*)').eq('site_id', site.id);
  const { data: schemas } = await supabase.from('schema_markup').select('*').eq('site_id', site.id);
  const { data: aeoConfig } = await supabase.from('aeo_configs').select('*').eq('site_id', site.id).single();

  const allSections = (pages || []).flatMap((p: any) => p.sections || []);
  const hasOrgSchema = (schemas || []).some((s: any) => s.type === 'ORGANIZATION');
  const hasLocalSchema = (schemas || []).some((s: any) => s.type === 'LOCALBUSINESS');
  const hasFaqSchema = (schemas || []).some((s: any) => s.type === 'FAQPAGE');
  const hasBlogSchema = (schemas || []).some((s: any) => s.type === 'BLOGPOSTING');
  const hasAeoSections = allSections.some((s: any) => s.is_aeo_optimized);
  const hasFaqs = allSections.some((s: any) => s.type === 'FAQ');
  const daysSinceUpdate = Math.floor((Date.now() - new Date(site.updated_at).getTime()) / (1000 * 60 * 60 * 24));

  const schemaScore = Math.min(25, (hasOrgSchema ? 5 : 0) + (hasLocalSchema ? 5 : 0) + (hasFaqSchema ? 5 : 0) + (hasBlogSchema ? 3 : 0) + (schemas?.some((s: any) => s.type === 'BREADCRUMBLIST') ? 3 : 0) + 4);
  const contentScore = Math.min(25, (hasAeoSections ? 8 : 0) + (hasFaqs ? 5 : 0) + 12);
  const speedScore = 20;
  const freshnessScore = daysSinceUpdate < 30 ? 15 : daysSinceUpdate < 90 ? 12 : daysSinceUpdate < 180 ? 8 : 5;
  const mobileScore = 15;
  const overall = schemaScore + contentScore + speedScore + freshnessScore + mobileScore;

  // Save score
  await supabase.from('aeo_scores').insert({ site_id: site.id, score: overall, category: 'overall', details: { schema: schemaScore, content: contentScore, speed: speedScore, freshness: freshnessScore, mobile: mobileScore } });
  await supabase.from('sites').update({ aeo_score: overall }).eq('id', site.id);

  const recommendations = [];
  if (!hasOrgSchema) recommendations.push({ priority: 'high', category: 'schema', message: 'Add Organization schema to establish brand identity', action: 'generate-schema' });
  if (!hasFaqs) recommendations.push({ priority: 'medium', category: 'content', message: 'Add an FAQ section to improve AEO coverage', action: 'add-faq' });
  if (freshnessScore < 10) recommendations.push({ priority: 'medium', category: 'freshness', message: 'Content is stale. Update your site to improve AI citation rates.', action: 'update-content' });
  if (!hasLocalSchema && aeoConfig?.business_type) recommendations.push({ priority: 'medium', category: 'schema', message: `Add ${aeoConfig.business_type} schema for local search visibility`, action: 'generate-local-schema' });

  return { overall, breakdown: { schema: schemaScore, content: contentScore, speed: speedScore, freshness: freshnessScore, mobile: mobileScore }, recommendations, lastUpdated: site.updated_at };
}

export async function generateAllSchema(site: any): Promise<any> {
  const { data: pages } = await supabase.from('pages').select('*, sections:sections(*)').eq('site_id', site.id);
  const { data: aeoConfig } = await supabase.from('aeo_configs').select('*').eq('site_id', site.id).single();

  const schemas = [];

  // Organization schema
  const orgSchema = await generateOrganizationSchema(site, aeoConfig);
  await supabase.from('schema_markup').upsert({ id: `${site.id}-org`, site_id: site.id, type: 'ORGANIZATION', json_ld: orgSchema, is_valid: true }, { onConflict: 'id' });
  schemas.push({ type: 'ORGANIZATION', jsonLd: orgSchema });

  // LocalBusiness schema
  if (aeoConfig?.business_type) {
    const localSchema = await generateLocalBusinessSchema(site, aeoConfig);
    await supabase.from('schema_markup').upsert({ id: `${site.id}-local`, site_id: site.id, type: 'LOCALBUSINESS', json_ld: localSchema, is_valid: true }, { onConflict: 'id' });
    schemas.push({ type: 'LOCALBUSINESS', jsonLd: localSchema });
  }

  // Page schemas
  for (const page of pages || []) {
    if (page.schema_type) {
      const pageSchema = {
        '@context': 'https://schema.org',
        '@type': page.schema_type,
        name: page.name,
        description: page.meta_description || ''
      };
      await supabase.from('schema_markup').upsert({ id: `${site.id}-${page.id}`, site_id: site.id, page_id: page.id, type: page.schema_type, json_ld: JSON.stringify(pageSchema), is_valid: true }, { onConflict: 'id' });
      schemas.push({ type: page.schema_type, pageId: page.id, jsonLd: JSON.stringify(pageSchema) });
    }
    // FAQ schema
    const faqSchema = await generateFaqPageSchema(page, page.sections || []);
    if (faqSchema) {
      await supabase.from('schema_markup').upsert({ id: `${site.id}-${page.id}-faq`, site_id: site.id, page_id: page.id, type: 'FAQPAGE', json_ld: faqSchema, is_valid: true }, { onConflict: 'id' });
      schemas.push({ type: 'FAQPAGE', pageId: page.id, jsonLd: faqSchema });
    }
  }

  return { success: true, schemasGenerated: schemas.length };
}

export async function generateAllAeoFiles(site: any): Promise<any> {
  const { data: pages } = await supabase.from('pages').select('*').eq('site_id', site.id);
  const { data: aeoConfig } = await supabase.from('aeo_configs').select('*').eq('site_id', site.id).single();

  const sitemap = generateSitemap(site, pages || []);
  const robots = generateRobotsTxt(site);
  const llmsTxt = generateLlmsTxt(site, aeoConfig, pages || []);

  return { sitemap, robots, llmsTxt };
}

export async function runAeoAudit(siteId: string): Promise<any> {
  const { data: site } = await supabase.from('sites').select('*').eq('id', siteId).single();
  if (!site) throw new Error('Site not found');

  await generateAllSchema(site);
  const score = await calculateAeoScore(site);
  const files = await generateAllAeoFiles(site);

  return { score, files };
}
