-- Supabase SQL Schema for SiteForge AI
-- Run this in Supabase SQL Editor

-- Enable RLS
alter table if exists sites enable row level security;
alter table if exists pages enable row level security;
alter table if exists sections enable row level security;
alter table if exists aeo_configs enable row level security;
alter table if exists schema_markup enable row level security;
alter table if exists aeo_scores enable row level security;
alter table if exists ai_generations enable row level security;
alter table if exists assets enable row level security;
alter table if exists deployments enable row level security;
alter table if exists contacts enable row level security;
alter table if exists plans enable row level security;
alter table if exists subscriptions enable row level security;
alter table if exists analytics_events enable row level security;
alter table if exists templates enable row level security;
alter table if exists domains enable row level security;
alter table if exists team_members enable row level security;

-- Drop existing tables
DROP TABLE IF EXISTS analytics_events, subscriptions, plans, contacts, deployments, assets, ai_generations, aeo_scores, schema_markup, aeo_configs, sections, page_versions, pages, domains, team_members, templates CASCADE;

-- Templates
create table templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  industry text,
  thumbnail_url text,
  preview_url text,
  config jsonb default '{}',
  is_official boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Plans
create table plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  price_monthly int default 0,
  price_yearly int default 0,
  max_sites int default 1,
  max_pages int default 5,
  max_ai_generations_per_month int default 50,
  max_assets int default 100,
  max_team_members int default 1,
  max_products int default 0,
  features jsonb default '{}',
  is_active boolean default true
);

-- Sites
create table sites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  status text default 'DRAFT',
  industry text,
  location text,
  timezone text default 'America/New_York',
  brand_colors jsonb default '{"primary":"#3B82F6","secondary":"#10B981","accent":"#F59E0B","background":"#FFFFFF","text":"#1F2937"}',
  brand_fonts jsonb default '{"heading":"Inter","body":"Inter"}',
  logo_url text,
  favicon_url text,
  aeo_config_id uuid,
  aeo_score int default 0,
  meta_title text,
  meta_description text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_published_at timestamptz
);

-- Domains
create table domains (
  id uuid default gen_random_uuid() primary key,
  domain text unique not null,
  site_id uuid references sites(id) on delete cascade,
  ssl_enabled boolean default true,
  dns_verified boolean default false,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Pages
create table pages (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  name text not null,
  slug text not null,
  path text not null,
  is_home_page boolean default false,
  is_visible boolean default true,
  sort_order int default 0,
  meta_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  schema_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(site_id, slug)
);

-- Sections
create table sections (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references pages(id) on delete cascade,
  type text not null,
  name text not null,
  sort_order int default 0,
  config jsonb default '{}',
  styles jsonb,
  is_aeo_optimized boolean default false,
  aeo_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Page Versions
create table page_versions (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references pages(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  created_by text not null,
  created_at timestamptz default now()
);

-- AEO Configs
create table aeo_configs (
  id uuid default gen_random_uuid() primary key,
  org_name text not null,
  org_description text,
  org_url text,
  org_logo_url text,
  org_same_as jsonb,
  business_type text,
  address jsonb,
  geo_coordinates jsonb,
  telephone text,
  email text,
  opening_hours jsonb,
  price_range text,
  target_keywords jsonb,
  content_tone text default 'professional',
  auto_generate_schema boolean default true,
  auto_generate_sitemap boolean default true,
  auto_generate_robots boolean default true,
  auto_generate_llms_txt boolean default true,
  site_id uuid references sites(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Schema Markup
create table schema_markup (
  id text primary key,
  site_id uuid references sites(id) on delete cascade,
  page_id uuid references pages(id) on delete cascade,
  type text not null,
  json_ld text not null,
  is_valid boolean default true,
  validation_errors jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AEO Scores
create table aeo_scores (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  score int not null,
  category text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- AI Generations
create table ai_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  type text not null,
  prompt text not null,
  output jsonb,
  status text default 'PENDING',
  tokens_used int,
  cost_cents int,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Assets
create table assets (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  name text not null,
  type text not null,
  url text not null,
  size int,
  width int,
  height int,
  alt_text text,
  created_at timestamptz default now()
);

-- Deployments
create table deployments (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  version text not null,
  status text default 'PENDING',
  preview_url text,
  live_url text,
  build_log text,
  static_files jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Contacts (CRM)
create table contacts (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  source text,
  status text default 'NEW',
  notes text,
  tags jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  plan_id uuid references plans(id),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  stripe_price_id text,
  status text default 'INCOMPLETE',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Analytics Events
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade,
  type text not null,
  page_path text,
  referrer text,
  user_agent text,
  ip_address text,
  country text,
  device text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Team Members
create table team_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  role text default 'EDITOR',
  created_at timestamptz default now(),
  unique(user_id, site_id)
);

-- RLS Policies
-- Sites: owner can CRUD, team members can read
CREATE POLICY "Sites owner can manage" ON sites FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Sites team members can view" ON sites FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.site_id = sites.id AND team_members.user_id = auth.uid()));

-- Pages: owner can CRUD
CREATE POLICY "Pages owner can manage" ON pages FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = pages.site_id AND sites.owner_id = auth.uid()));

-- Sections: owner can CRUD
CREATE POLICY "Sections owner can manage" ON sections FOR ALL USING (EXISTS (SELECT 1 FROM pages JOIN sites ON pages.site_id = sites.id WHERE pages.id = sections.page_id AND sites.owner_id = auth.uid()));

-- AEO configs: owner can manage
CREATE POLICY "AEO owner can manage" ON aeo_configs FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = aeo_configs.site_id AND sites.owner_id = auth.uid()));

-- Schema markup: owner can manage
CREATE POLICY "Schema owner can manage" ON schema_markup FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = schema_markup.site_id AND sites.owner_id = auth.uid()));

-- AI generations: owner can manage
CREATE POLICY "AI gen owner can manage" ON ai_generations FOR ALL USING (user_id = auth.uid());

-- Assets: owner can manage
CREATE POLICY "Assets owner can manage" ON assets FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = assets.site_id AND sites.owner_id = auth.uid()));

-- Contacts: owner can manage
CREATE POLICY "Contacts owner can manage" ON contacts FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = contacts.site_id AND sites.owner_id = auth.uid()));

-- Deployments: owner can manage
CREATE POLICY "Deployments owner can manage" ON deployments FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = deployments.site_id AND sites.owner_id = auth.uid()));

-- Analytics: owner can manage
CREATE POLICY "Analytics owner can manage" ON analytics_events FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = analytics_events.site_id AND sites.owner_id = auth.uid()));

-- Team members: owner can manage
CREATE POLICY "Team owner can manage" ON team_members FOR ALL USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = team_members.site_id AND sites.owner_id = auth.uid()));

-- Templates: public read
CREATE POLICY "Templates public read" ON templates FOR SELECT USING (true);

-- Plans: public read
CREATE POLICY "Plans public read" ON plans FOR SELECT USING (true);

-- Subscriptions: owner can manage
CREATE POLICY "Subscriptions owner can manage" ON subscriptions FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_sites_owner ON sites(owner_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_sections_page ON sections(page_id);
CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_site ON ai_generations(site_id);
CREATE INDEX idx_aeo_scores_site ON aeo_scores(site_id);
CREATE INDEX idx_analytics_events_site ON analytics_events(site_id);
CREATE INDEX idx_contacts_site ON contacts(site_id);
CREATE INDEX idx_deployments_site ON deployments(site_id);
CREATE INDEX idx_assets_site ON assets(site_id);

-- Seed data
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, max_sites, max_pages, max_ai_generations_per_month, max_assets, max_team_members, max_products, features) VALUES
('Free', 'free', 'Build one AI-powered website with AEO optimization', 0, 0, 1, 5, 10, 50, 1, 0, '{"customDomain": false, "codeExport": false, "aeoDashboard": true, "analytics": false, "prioritySupport": false}'),
('Starter', 'starter', 'For small businesses ready to get found by AI', 1900, 19000, 1, 10, 50, 100, 1, 0, '{"customDomain": true, "codeExport": true, "aeoDashboard": true, "analytics": true, "prioritySupport": false}'),
('Pro', 'pro', 'For growing businesses with advanced AEO needs', 4900, 49000, 3, 999, 200, 1000, 3, 50, '{"customDomain": true, "codeExport": true, "aeoDashboard": true, "analytics": true, "prioritySupport": true}');

INSERT INTO templates (name, slug, description, industry, config, is_official, is_active) VALUES
('Local Services', 'local-services', 'For plumbers, electricians, HVAC, and local service businesses', 'local-services', '{"pages": [{"name": "Home", "slug": "", "sections": ["HERO", "FEATURES", "TESTIMONIALS", "CTA", "FOOTER"]}, {"name": "Services", "slug": "services", "sections": ["TEXT", "FEATURES", "FAQ", "FOOTER"]}, {"name": "About", "slug": "about", "sections": ["TEXT", "STATS", "FOOTER"]}, {"name": "Contact", "slug": "contact", "sections": ["TEXT", "CONTACT_FORM", "FOOTER"]}]}', true, true),
('Professional Consultant', 'consultant', 'For consultants, coaches, and advisors', 'consulting', '{"pages": [{"name": "Home", "slug": "", "sections": ["HERO", "STATS", "TESTIMONIALS", "CTA", "FOOTER"]}, {"name": "About", "slug": "about", "sections": ["TEXT", "STATS", "FOOTER"]}, {"name": "Services", "slug": "services", "sections": ["FEATURES", "FAQ", "FOOTER"]}, {"name": "Contact", "slug": "contact", "sections": ["TEXT", "CONTACT_FORM", "FOOTER"]}]}', true, true),
('Restaurant', 'restaurant', 'For restaurants, cafes, and food businesses', 'restaurant', '{"pages": [{"name": "Home", "slug": "", "sections": ["HERO", "FEATURES", "IMAGE_GALLERY", "CTA", "FOOTER"]}, {"name": "Menu", "slug": "menu", "sections": ["TEXT", "FEATURES", "FOOTER"]}, {"name": "About", "slug": "about", "sections": ["TEXT", "IMAGE_GALLERY", "FOOTER"]}, {"name": "Contact", "slug": "contact", "sections": ["TEXT", "CONTACT_FORM", "FOOTER"]}]}', true, true);
