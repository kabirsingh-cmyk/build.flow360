import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ArrowLeft, Eye, Save, Smartphone, Monitor, Tablet, Sparkles, Layout, Type, Image, HelpCircle, Phone, ChevronUp, ChevronDown, Trash2, Settings, BarChart3, Globe } from 'lucide-react'
import { cn, getAeoScoreColor, getAeoScoreLabel } from '../lib/utils'

interface Section {
  id: string
  type: string
  name: string
  config: any
  sortOrder: number
  isAeoOptimized: boolean
}

interface Page {
  id: string
  name: string
  slug: string
  sections: Section[]
}

interface SiteData {
  id: string
  name: string
  slug: string
  brandColors: any
  brandFonts: any
  aeoScore: number
  pages: Page[]
}

const SECTION_COMPONENTS = [
  { type: 'HERO', icon: Layout, label: 'Hero', description: 'Big headline with CTA' },
  { type: 'TEXT', icon: Type, label: 'Text Block', description: 'Paragraphs and headings' },
  { type: 'FEATURES', icon: Layout, label: 'Features', description: 'Grid of features' },
  { type: 'TESTIMONIALS', icon: Type, label: 'Testimonials', description: 'Customer reviews' },
  { type: 'FAQ', icon: HelpCircle, label: 'FAQ', description: 'Questions and answers' },
  { type: 'CTA', icon: Layout, label: 'Call to Action', description: 'Conversion section' },
  { type: 'CONTACT_FORM', icon: Phone, label: 'Contact Form', description: 'Get in touch' },
  { type: 'IMAGE_GALLERY', icon: Image, label: 'Image Gallery', description: 'Photo grid' },
  { type: 'STATS', icon: Layout, label: 'Stats', description: 'Numbers and metrics' },
  { type: 'FOOTER', icon: Layout, label: 'Footer', description: 'Site footer' },
]

export default function Editor() {
  const { siteId, pageId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<SiteData | null>(null)
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState<'components' | 'pages' | 'ai'>('components')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    loadSite()
  }, [siteId])

  const loadSite = async () => {
    try {
      const res = await api.sites.get(siteId!)
      const data = res.data
      setSite(data)
      
      const targetPage = pageId 
        ? data.pages.find((p: Page) => p.id === pageId)
        : data.pages.find((p: Page) => p.isHomePage) || data.pages[0]
      
      setCurrentPage(targetPage)
    } catch (err) {
      console.error('Failed to load site:', err)
    } finally {
      setLoading(false)
    }
  }

  const addSection = async (type: string) => {
    if (!currentPage) return
    
    const defaultConfigs: Record<string, any> = {
      HERO: {
        heading: 'Your Hero Headline',
        subheading: 'A compelling description of your business goes here.',
        ctaText: 'Get Started',
        ctaUrl: '#contact',
        alignment: 'center'
      },
      TEXT: {
        heading: 'Section Title',
        body: 'Add your content here. This section is perfect for explaining your services, telling your story, or providing detailed information.',
        alignment: 'left'
      },
      FEATURES: {
        heading: 'What We Offer',
        features: [
          { title: 'Feature One', description: 'Description of this feature', icon: 'star' },
          { title: 'Feature Two', description: 'Description of this feature', icon: 'zap' },
          { title: 'Feature Three', description: 'Description of this feature', icon: 'shield' },
        ]
      },
      FAQ: {
        heading: 'Frequently Asked Questions',
        items: [
          { question: 'What services do you offer?', answer: 'We offer a comprehensive range of services tailored to your needs.' },
          { question: 'How do I get started?', answer: 'Simply contact us through our form or call us directly.' },
          { question: 'What areas do you serve?', answer: 'We serve the greater metropolitan area and surrounding regions.' },
        ]
      },
      CTA: {
        heading: 'Ready to Get Started?',
        subheading: 'Contact us today for a free consultation.',
        ctaText: 'Contact Us',
        ctaUrl: '#contact',
        backgroundStyle: 'gradient'
      },
      CONTACT_FORM: {
        heading: 'Get In Touch',
        fields: ['name', 'email', 'phone', 'message'],
        submitText: 'Send Message'
      },
      STATS: {
        heading: 'Our Impact',
        stats: [
          { value: '500+', label: 'Happy Customers' },
          { value: '15', label: 'Years Experience' },
          { value: '99%', label: 'Satisfaction Rate' },
          { value: '24/7', label: 'Support Available' },
        ]
      },
      FOOTER: {
        columns: [
          { title: 'Company', links: ['About', 'Services', 'Contact'] },
          { title: 'Resources', links: ['Blog', 'FAQ', 'Support'] },
          { title: 'Legal', links: ['Privacy', 'Terms'] },
        ],
        copyright: '© 2026 All rights reserved.'
      }
    }

    try {
      const res = await api.sections.create(siteId!, currentPage.id, {
        type,
        name: type,
        config: defaultConfigs[type] || {},
        sortOrder: currentPage.sections.length
      })
      
      const newSection = res.data
      setCurrentPage({
        ...currentPage,
        sections: [...currentPage.sections, newSection]
      })
    } catch (err) {
      console.error('Failed to add section:', err)
    }
  }

  const updateSection = async (sectionId: string, config: any) => {
    if (!currentPage) return
    
    try {
      await api.sections.update(siteId!, currentPage.id, sectionId, { config })
      setCurrentPage({
        ...currentPage,
        sections: currentPage.sections.map(s => 
          s.id === sectionId ? { ...s, config } : s
        )
      })
    } catch (err) {
      console.error('Failed to update section:', err)
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!currentPage) return
    if (!confirm('Delete this section?')) return
    
    try {
      await api.sections.delete(siteId!, currentPage.id, sectionId)
      setCurrentPage({
        ...currentPage,
        sections: currentPage.sections.filter(s => s.id !== sectionId)
      })
    } catch (err) {
      console.error('Failed to delete section:', err)
    }
  }

  const reorderSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!currentPage) return
    const idx = currentPage.sections.findIndex(s => s.id === sectionId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === currentPage.sections.length - 1) return
    
    const newSections = [...currentPage.sections]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]]
    
    setCurrentPage({ ...currentPage, sections: newSections })
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      // Save all sections
      for (const section of currentPage?.sections || []) {
        await api.sections.update(siteId!, currentPage!.id, section.id, { config: section.config })
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const publishSite = async () => {
    setPublishing(true)
    try {
      await api.sites.publish(siteId!)
      alert('Site published successfully!')
    } catch (err) {
      console.error('Failed to publish:', err)
      alert('Failed to publish site')
    } finally {
      setPublishing(false)
    }
  }

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    try {
      await api.sites.generate(siteId!, { prompt: aiPrompt })
      alert('AI generation started! Check back in a few minutes.')
      setAiPrompt('')
    } catch (err) {
      console.error('AI generation failed:', err)
    } finally {
      setAiGenerating(false)
    }
  }

  const renderSection = (section: Section) => {
    const isSelected = selectedSection === section.id
    const brandColors = site?.brandColors || { primary: '#3B82F6', secondary: '#10B981', background: '#FFFFFF', text: '#1F2937' }
    
    const sectionContent = (() => {
      switch (section.type) {
        case 'HERO':
          return (
            <div className="py-20 px-6 text-center" style={{ background: `linear-gradient(135deg, ${brandColors.primary}15, ${brandColors.secondary}15)` }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: brandColors.text }}>
                {section.config.heading || 'Hero Headline'}
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: brandColors.text + 'cc' }}>
                {section.config.subheading || 'Subheading goes here'}
              </p>
              <button className="px-8 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: brandColors.primary }}>
                {section.config.ctaText || 'Get Started'}
              </button>
            </div>
          )
        
        case 'TEXT':
          return (
            <div className="py-16 px-6 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6" style={{ color: brandColors.text }}>
                {section.config.heading || 'Section Title'}
              </h2>
              <div className="prose prose-lg max-w-none" style={{ color: brandColors.text + 'cc' }}>
                <p>{section.config.body || 'Content goes here'}</p>
              </div>
            </div>
          )
        
        case 'FEATURES':
          return (
            <div className="py-16 px-6">
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: brandColors.text }}>
                {section.config.heading || 'Features'}
              </h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {(section.config.features || []).map((f: any, i: number) => (
                  <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: brandColors.primary + '20' }}>
                      <span style={{ color: brandColors.primary }}>★</span>
                    </div>
                    <h3 className="font-bold mb-2" style={{ color: brandColors.text }}>{f.title}</h3>
                    <p className="text-sm" style={{ color: brandColors.text + 'aa' }}>{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        
        case 'FAQ':
          return (
            <div className="py-16 px-6 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: brandColors.text }}>
                {section.config.heading || 'FAQ'}
              </h2>
              <div className="space-y-4">
                {(section.config.items || []).map((item: any, i: number) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2" style={{ color: brandColors.text }}>{item.question}</h3>
                    <p className="text-sm" style={{ color: brandColors.text + 'aa' }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        
        case 'CTA':
          return (
            <div className="py-16 px-6 text-center" style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})` }}>
              <h2 className="text-3xl font-bold text-white mb-4">{section.config.heading || 'Call to Action'}</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">{section.config.subheading || 'Take the next step'}</p>
              <button className="px-8 py-3 rounded-lg font-semibold bg-white" style={{ color: brandColors.primary }}>
                {section.config.ctaText || 'Contact Us'}
              </button>
            </div>
          )
        
        case 'CONTACT_FORM':
          return (
            <div className="py-16 px-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8" style={{ color: brandColors.text }}>
                {section.config.heading || 'Contact Us'}
              </h2>
              <div className="space-y-4">
                {(section.config.fields || ['name', 'email', 'message']).map((field: string) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize" style={{ color: brandColors.text }}>{field}</label>
                    <input
                      type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      placeholder={`Enter your ${field}`}
                    />
                  </div>
                ))}
                <button className="w-full py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: brandColors.primary }}>
                  {section.config.submitText || 'Send Message'}
                </button>
              </div>
            </div>
          )
        
        case 'STATS':
          return (
            <div className="py-16 px-6">
              <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
                {(section.config.stats || []).map((stat: any, i: number) => (
                  <div key={i}>
                    <div className="text-4xl font-bold mb-2" style={{ color: brandColors.primary }}>{stat.value}</div>
                    <div className="text-sm" style={{ color: brandColors.text + 'aa' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        
        case 'FOOTER':
          return (
            <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-700" style={{ backgroundColor: brandColors.background }}>
              <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
                <div>
                  <div className="font-bold text-lg mb-4" style={{ color: brandColors.text }}>{site?.name || 'SiteForge'}</div>
                  <p className="text-sm" style={{ color: brandColors.text + 'aa' }}>Built with SiteForge AI</p>
                </div>
                {(section.config.columns || []).map((col: any, i: number) => (
                  <div key={i}>
                    <h4 className="font-semibold mb-3" style={{ color: brandColors.text }}>{col.title}</h4>
                    <ul className="space-y-2">
                      {col.links.map((link: string, j: number) => (
                        <li key={j}><a href="#" className="text-sm hover:underline" style={{ color: brandColors.text + 'aa' }}>{link}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-sm" style={{ color: brandColors.text + '88' }}>
                {section.config.copyright || '© 2026 All rights reserved.'}
              </div>
            </footer>
          )
        
        default:
          return <div className="p-8 text-center text-gray-500">Unknown section type: {section.type}</div>
      }
    })()

    return (
      <div
        className={cn(
          'editor-section relative',
          isSelected && 'selected'
        )}
        onClick={() => setSelectedSection(section.id)}
      >
        {isSelected && (
          <div className="absolute top-0 right-0 z-10 flex items-center gap-1 bg-blue-500 text-white text-xs rounded-bl-lg px-2 py-1">
            <button onClick={(e) => { e.stopPropagation(); reorderSection(section.id, 'up') }} className="hover:bg-blue-600 px-1 rounded"><ChevronUp size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); reorderSection(section.id, 'down') }} className="hover:bg-blue-600 px-1 rounded"><ChevronDown size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id) }} className="hover:bg-red-600 px-1 rounded"><Trash2 size={14} /></button>
          </div>
        )}
        {sectionContent}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!site) {
    return <div className="p-8">Site not found</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-semibold">{site.name}</h1>
            <p className="text-xs text-gray-500">{site.slug}.siteforge.ai</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className={`aeo-score-badge aeo-score-${getAeoScoreColor(site.aeoScore)}`}>
              AEO {site.aeoScore} — {getAeoScoreLabel(site.aeoScore)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setDevicePreview('desktop')} className={cn('p-1.5 rounded', devicePreview === 'desktop' && 'bg-white dark:bg-gray-600 shadow-sm')}><Monitor size={16} /></button>
            <button onClick={() => setDevicePreview('tablet')} className={cn('p-1.5 rounded', devicePreview === 'tablet' && 'bg-white dark:bg-gray-600 shadow-sm')}><Tablet size={16} /></button>
            <button onClick={() => setDevicePreview('mobile')} className={cn('p-1.5 rounded', devicePreview === 'mobile' && 'bg-white dark:bg-gray-600 shadow-sm')}><Smartphone size={16} /></button>
          </div>
          
          <button onClick={() => navigate(`/settings/${siteId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <Settings size={18} />
          </button>
          <button onClick={() => navigate(`/aeo/${siteId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <BarChart3 size={18} />
          </button>
          <button onClick={saveChanges} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={publishSite} disabled={publishing} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
            <Globe size={16} />
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setActiveTab('components')} className={cn('flex-1 py-3 text-sm font-medium border-b-2 transition', activeTab === 'components' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500')}>
              Components
            </button>
            <button onClick={() => setActiveTab('pages')} className={cn('flex-1 py-3 text-sm font-medium border-b-2 transition', activeTab === 'pages' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500')}>
              Pages
            </button>
            <button onClick={() => setActiveTab('ai')} className={cn('flex-1 py-3 text-sm font-medium border-b-2 transition', activeTab === 'ai' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500')}>
              AI
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'components' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Click to add to page</p>
                {SECTION_COMPONENTS.map((comp) => (
                  <button
                    key={comp.type}
                    onClick={() => addSection(comp.type)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left"
                  >
                    <comp.icon size={18} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">{comp.label}</div>
                      <div className="text-xs text-gray-500">{comp.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Manage pages</p>
                {site.pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition',
                      currentPage?.id === page.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div className="font-medium text-sm">{page.name}</div>
                    <div className="text-xs text-gray-500">{page.sections.length} sections</div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Describe what you want to add or change</p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm min-h-[100px] resize-none"
                  placeholder="Add a testimonial section with 3 customer reviews..."
                />
                <button
                  onClick={generateWithAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {aiGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8">
          <div className={cn(
            'mx-auto bg-white dark:bg-gray-800 shadow-lg min-h-[600px]',
            devicePreview === 'desktop' && 'max-w-5xl',
            devicePreview === 'tablet' && 'max-w-2xl',
            devicePreview === 'mobile' && 'max-w-sm'
          )}>
            {currentPage?.sections.map((section) => renderSection(section))}
            {(!currentPage?.sections || currentPage.sections.length === 0) && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Layout className="text-blue-500" size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">Start building your page</h3>
                <p className="text-gray-500 mb-6 max-w-sm">Add sections from the sidebar or use AI to generate content</p>
                <button onClick={() => addSection('HERO')} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition">
                  Add Hero Section
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel - Section Properties */}
        {selectedSection && (
          <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Section Properties</h3>
            {(() => {
              const section = currentPage?.sections.find(s => s.id === selectedSection)
              if (!section) return null
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                    <div className="text-sm font-medium">{section.type}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">AEO Optimized</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-sm', section.isAeoOptimized ? 'text-green-500' : 'text-yellow-500')}>
                        {section.isAeoOptimized ? '✓ Yes' : '○ Not yet'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Config (JSON)</label>
                    <textarea
                      value={JSON.stringify(section.config, null, 2)}
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value)
                          updateSection(section.id, config)
                        } catch {}
                      }}
                      className="w-full h-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-mono resize-none"
                    />
                  </div>
                </div>
              )
            })()}
          </aside>
        )}
      </div>
    </div>
  )
}
