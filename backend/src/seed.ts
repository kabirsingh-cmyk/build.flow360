import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free',
      slug: 'free',
      description: 'Build one AI-powered website with AEO optimization',
      priceMonthly: 0,
      priceYearly: 0,
      maxSites: 1,
      maxPages: 5,
      maxAiGenerationsPerMonth: 10,
      maxAssets: 50,
      maxTeamMembers: 1,
      maxProducts: 0,
      features: {
        customDomain: false,
        codeExport: false,
        aeoDashboard: true,
        analytics: false,
        prioritySupport: false
      }
    }
  })

  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'For small businesses ready to get found by AI',
      priceMonthly: 1900, // $19
      priceYearly: 19000, // $190
      maxSites: 1,
      maxPages: 10,
      maxAiGenerationsPerMonth: 50,
      maxAssets: 100,
      maxTeamMembers: 1,
      maxProducts: 0,
      features: {
        customDomain: true,
        codeExport: true,
        aeoDashboard: true,
        analytics: true,
        prioritySupport: false
      }
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      description: 'For growing businesses with advanced AEO needs',
      priceMonthly: 4900, // $49
      priceYearly: 49000, // $490
      maxSites: 3,
      maxPages: 999,
      maxAiGenerationsPerMonth: 200,
      maxAssets: 1000,
      maxTeamMembers: 3,
      maxProducts: 50,
      features: {
        customDomain: true,
        codeExport: true,
        aeoDashboard: true,
        analytics: true,
        prioritySupport: true
      }
    }
  })

  // Seed templates
  const templates = [
    {
      name: 'Local Services',
      slug: 'local-services',
      description: 'Perfect for plumbers, electricians, HVAC, and other local service businesses',
      industry: 'local-services',
      config: {
        pages: [
          { name: 'Home', slug: '', sections: ['HERO', 'FEATURES', 'TESTIMONIALS', 'CTA', 'FOOTER'] },
          { name: 'Services', slug: 'services', sections: ['TEXT', 'FEATURES', 'FAQ', 'FOOTER'] },
          { name: 'About', slug: 'about', sections: ['TEXT', 'TEAM', 'STATS', 'FOOTER'] },
          { name: 'Contact', slug: 'contact', sections: ['TEXT', 'CONTACT_FORM', 'FOOTER'] }
        ]
      }
    },
    {
      name: 'Professional Consultant',
      slug: 'consultant',
      description: 'For consultants, coaches, and professional advisors',
      industry: 'consulting',
      config: {
        pages: [
          { name: 'Home', slug: '', sections: ['HERO', 'STATS', 'TESTIMONIALS', 'CTA', 'FOOTER'] },
          { name: 'About', slug: 'about', sections: ['TEXT', 'STATS', 'FOOTER'] },
          { name: 'Services', slug: 'services', sections: ['FEATURES', 'PRICING', 'FAQ', 'FOOTER'] },
          { name: 'Contact', slug: 'contact', sections: ['TEXT', 'CONTACT_FORM', 'FOOTER'] }
        ]
      }
    },
    {
      name: 'Restaurant',
      slug: 'restaurant',
      description: 'For restaurants, cafes, and food businesses',
      industry: 'restaurant',
      config: {
        pages: [
          { name: 'Home', slug: '', sections: ['HERO', 'FEATURES', 'IMAGE_GALLERY', 'CTA', 'FOOTER'] },
          { name: 'Menu', slug: 'menu', sections: ['TEXT', 'FEATURES', 'FOOTER'] },
          { name: 'About', slug: 'about', sections: ['TEXT', 'IMAGE_GALLERY', 'FOOTER'] },
          { name: 'Contact', slug: 'contact', sections: ['TEXT', 'CONTACT_FORM', 'FOOTER'] }
        ]
      }
    }
  ]

  for (const t of templates) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        name: t.name,
        slug: t.slug,
        description: t.description,
        industry: t.industry,
        config: t.config,
        isOfficial: true,
        isActive: true
      }
    })
  }

  console.log('✅ Seed completed:')
  console.log(`  - Plans: Free, Starter ($19), Pro ($49)`)
  console.log(`  - Templates: ${templates.length}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })