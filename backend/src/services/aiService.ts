import { chatCompletion } from '../lib/openrouter';
import { supabase } from '../lib/supabase';

export interface StructuredIntent {
  businessName: string;
  industry: string;
  location: string;
  services: string[];
  targetAudience: string;
  tone: string;
  goals: string;
  requiredPages: string[];
  requiredFeatures: string[];
  brandPersonality: string[];
}

export interface DesignSystem {
  colorPalette: { primary: string; secondary: string; accent: string; background: string; text: string };
  typography: { headingFont: string; bodyFont: string };
}

export interface PageArchitecture {
  name: string;
  slug: string;
  sections: { type: string; purpose: string; contentOutline: string }[];
}

export async function parseIntent(prompt: string): Promise<StructuredIntent> {
  const res = await chatCompletion([
    {
      role: 'system',
      content: 'You are an expert business analyst. Parse the user prompt into a structured JSON object with: businessName, industry, location, services (array), targetAudience, tone (professional/friendly/authoritative/casual), goals, requiredPages (array), requiredFeatures (array), brandPersonality (3 adjectives). Respond ONLY with valid JSON.'
    },
    { role: 'user', content: prompt }
  ], 'openai/gpt-4o', { type: 'json_object' }, 2000);

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  const intent = JSON.parse(content);
  return {
    businessName: intent.businessName || 'My Business',
    industry: intent.industry || 'services',
    location: intent.location || '',
    services: intent.services || [],
    targetAudience: intent.targetAudience || 'Local customers',
    tone: intent.tone || 'professional',
    goals: intent.goals || 'Generate leads',
    requiredPages: intent.requiredPages || ['Home', 'About', 'Services', 'Contact'],
    requiredFeatures: intent.requiredFeatures || [],
    brandPersonality: intent.brandPersonality || ['professional', 'trustworthy', 'friendly']
  };
}

export async function generateDesignSystem(intent: StructuredIntent): Promise<DesignSystem> {
  const colors: Record<string, any> = {
    hvac: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
    restaurant: { primary: '#EF4444', secondary: '#F59E0B', accent: '#10B981' },
    consulting: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#EC4899' },
    healthcare: { primary: '#06B6D4', secondary: '#10B981', accent: '#3B82F6' },
    default: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' }
  };
  const c = colors[intent.industry] || colors.default;
  return {
    colorPalette: { ...c, background: '#FFFFFF', text: '#1F2937' },
    typography: { headingFont: 'Inter', bodyFont: 'Inter' }
  };
}

export async function generatePageArchitecture(intent: StructuredIntent): Promise<PageArchitecture[]> {
  const sectionMap: Record<string, string[]> = {
    Home: ['HERO', 'FEATURES', 'TESTIMONIALS', 'CTA', 'FOOTER'],
    Services: ['TEXT', 'FEATURES', 'FAQ', 'FOOTER'],
    About: ['TEXT', 'STATS', 'FOOTER'],
    Contact: ['TEXT', 'CONTACT_FORM', 'FOOTER']
  };
  return intent.requiredPages.map((name: string) => ({
    name,
    slug: name === 'Home' ? '' : name.toLowerCase().replace(/\s+/g, '-'),
    sections: (sectionMap[name] || ['TEXT', 'FOOTER']).map(type => ({
      type,
      purpose: 'Content section',
      contentOutline: `${type} section for ${name} page`
    }))
  }));
}

export async function generateSectionContent(sectionType: string, pageName: string, intent: StructuredIntent): Promise<any> {
  const prompts: Record<string, string> = {
    HERO: `Write a hero section for "${intent.businessName}" (${intent.industry}). Include: headline (6 words max), subheading (2 sentences), CTA text. Tone: ${intent.tone}.`,
    TEXT: `Write "${pageName}" page content for "${intent.businessName}". Include heading and 2-3 paragraphs. Tone: ${intent.tone}.`,
    FEATURES: `Write 3 service descriptions for "${intent.businessName}". Services: ${intent.services.join(', ') || 'general'}.`,
    FAQ: `Write 3 FAQ Q&A pairs for a ${intent.industry} business.`,
    CTA: `Write a call-to-action section for "${intent.businessName}".`,
    STATS: `Generate 4 realistic business statistics for a ${intent.industry} company.`,
    TESTIMONIALS: `Write 2 customer testimonials for "${intent.businessName}".`,
    CONTACT_FORM: `Write contact form heading and description for "${intent.businessName}".`,
    FOOTER: `Write footer content for "${intent.businessName}".`
  };

  try {
    const res = await chatCompletion([
      { role: 'system', content: 'You are an expert copywriter. Write concise, compelling website copy. Return JSON.' },
      { role: 'user', content: `${prompts[sectionType] || 'Write content'}\n\nReturn JSON with: heading, subheading, body, ctaText (if applicable), items (if FAQ/features), testimonials (if TESTIMONIALS), stats (if STATS).` }
    ], 'openai/gpt-4o', { type: 'json_object' }, 2000);

    const content = res.choices[0]?.message?.content;
    if (!content) return getFallbackContent(sectionType, intent);
    return JSON.parse(content);
  } catch (e) {
    return getFallbackContent(sectionType, intent);
  }
}

function getFallbackContent(type: string, intent: StructuredIntent): any {
  const base = {
    heading: `${intent.businessName} — ${type}`,
    subheading: 'Professional services you can trust',
    body: `Welcome to ${intent.businessName}. We provide exceptional services${intent.location ? ` in ${intent.location}` : ''}.`,
    ctaText: 'Contact Us',
    ctaUrl: '#contact'
  };
  switch (type) {
    case 'FEATURES':
      return { ...base, features: [{ title: 'Quality Service', description: 'Top-notch results every time.' }, { title: 'Expert Team', description: 'Skilled professionals ready to help.' }, { title: 'Fast Response', description: 'Quick turnaround on all projects.' }] };
    case 'FAQ':
      return { ...base, items: [{ question: 'What services do you offer?', answer: 'We offer comprehensive services tailored to your needs.' }, { question: 'How do I get started?', answer: 'Simply contact us and we will guide you.' }, { question: 'What areas do you serve?', answer: `We serve ${intent.location || 'the greater area'}.` }] };
    case 'STATS':
      return { ...base, stats: [{ value: '500+', label: 'Happy Customers' }, { value: '15+', label: 'Years Experience' }, { value: '99%', label: 'Satisfaction' }, { value: '24/7', label: 'Support' }] };
    case 'TESTIMONIALS':
      return { ...base, testimonials: [{ name: 'John D.', role: 'Customer', text: 'Excellent service! Highly recommended.', rating: 5 }, { name: 'Sarah M.', role: 'Business Owner', text: 'Professional and reliable.', rating: 5 }] };
    case 'FOOTER':
      return { ...base, columns: [{ title: 'Company', links: ['About', 'Services', 'Contact'] }, { title: 'Resources', links: ['FAQ', 'Blog'] }, { title: 'Legal', links: ['Privacy', 'Terms'] }], copyright: `© ${new Date().getFullYear()} ${intent.businessName}. All rights reserved.` };
    default:
      return base;
  }
}

export async function generateFullSite(siteId: string, userPrompt: string): Promise<any> {
  const intent = await parseIntent(userPrompt);
  const designSystem = await generateDesignSystem(intent);
  const pages = await generatePageArchitecture(intent);

  // Update site
  await supabase.from('sites').update({
    name: intent.businessName,
    industry: intent.industry,
    location: intent.location,
    description: intent.goals,
    brand_colors: designSystem.colorPalette,
    brand_fonts: designSystem.typography
  }).eq('id', siteId);

  // Update AEO config
  await supabase.from('aeo_configs').update({
    org_name: intent.businessName,
    org_description: intent.goals,
    business_type: intent.industry,
    target_keywords: intent.services,
    content_tone: intent.tone
  }).eq('site_id', siteId);

  // Generate pages and sections
  for (const page of pages) {
    const { data: createdPage } = await supabase.from('pages').insert({
      site_id: siteId,
      name: page.name,
      slug: page.slug,
      path: page.slug ? `/${page.slug}` : '/',
      is_home_page: page.name === 'Home',
      sort_order: pages.indexOf(page)
    }).select().single();

    if (!createdPage) continue;

    for (const section of page.sections) {
      const content = await generateSectionContent(section.type, page.name, intent);
      const config = buildSectionConfig(section.type, content, intent);
      await supabase.from('sections').insert({
        page_id: createdPage.id,
        type: section.type,
        name: section.type,
        sort_order: page.sections.indexOf(section),
        config,
        is_aeo_optimized: true
      });
    }
  }

  return { intent, designSystem, pages };
}

function buildSectionConfig(type: string, content: any, intent: StructuredIntent): any {
  const config: any = { heading: content.heading || '', subheading: content.subheading || '', body: content.body || '' };
  switch (type) {
    case 'HERO': config.ctaText = content.ctaText || 'Get Started'; config.ctaUrl = '#contact'; config.alignment = 'center'; break;
    case 'FEATURES': config.features = content.features || [{ title: 'Quality', description: 'Top service' }, { title: 'Expert', description: 'Skilled team' }, { title: 'Fast', description: 'Quick results' }]; break;
    case 'FAQ': config.items = content.items || [{ question: 'Q1?', answer: 'A1' }, { question: 'Q2?', answer: 'A2' }, { question: 'Q3?', answer: 'A3' }]; break;
    case 'CTA': config.ctaText = content.ctaText || 'Contact Us'; config.ctaUrl = '#contact'; config.backgroundStyle = 'gradient'; break;
    case 'CONTACT_FORM': config.fields = ['name', 'email', 'phone', 'message']; config.submitText = 'Send Message'; break;
    case 'STATS': config.stats = content.stats || [{ value: '500+', label: 'Customers' }, { value: '15+', label: 'Years' }, { value: '99%', label: 'Satisfaction' }, { value: '24/7', label: 'Support' }]; break;
    case 'TESTIMONIALS': config.testimonials = content.testimonials || [{ name: 'John', role: 'Customer', text: 'Great!', rating: 5 }]; break;
    case 'FOOTER': config.columns = content.columns || [{ title: 'Company', links: ['About', 'Services'] }, { title: 'Resources', links: ['FAQ', 'Blog'] }, { title: 'Legal', links: ['Privacy', 'Terms'] }]; config.copyright = content.copyright || `© ${new Date().getFullYear()} ${intent.businessName}`; break;
  }
  return config;
}

export async function rewriteText(text: string, tone: string = 'professional'): Promise<string> {
  try {
    const res = await chatCompletion([
      { role: 'system', content: `Rewrite the text to be more engaging, using a ${tone} tone. Keep similar length. Return only the text.` },
      { role: 'user', content: text }
    ], 'openai/gpt-4o', undefined, 1000);
    return res.choices[0]?.message?.content?.trim() || text;
  } catch { return text; }
}

export async function generateFaqBlock(topic: string, count: number = 3): Promise<any[]> {
  try {
    const res = await chatCompletion([
      { role: 'system', content: `Generate ${count} FAQ Q&A about: ${topic}. Return JSON array.` },
      { role: 'user', content: 'Generate FAQs' }
    ], 'openai/gpt-4o', { type: 'json_object' }, 1500);
    const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
    return parsed.faqs || parsed.items || [];
  } catch {
    return [{ question: `What is ${topic}?`, answer: 'We provide excellent service.' }, { question: 'How do I start?', answer: 'Contact us directly.' }, { question: 'Why choose you?', answer: 'Years of experience and happy customers.' }];
  }
}
