import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Globe, Sparkles, Settings, BarChart3, Trash2 } from 'lucide-react'
import { formatDate } from '../lib/utils'

interface Site {
  id: string
  name: string
  slug: string
  status: string
  aeoScore: number
  lastPublishedAt: string | null
  updatedAt: string
  _count: { pages: number }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [newSitePrompt, setNewSitePrompt] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    try {
      const res = await api.sites.list()
      setSites(res.data)
    } catch (err) {
      console.error('Failed to load sites:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.sites.create({
        name: newSiteName,
        description: newSitePrompt,
      })
      const site = res.data

      // If prompt provided, trigger AI generation
      if (newSitePrompt) {
        await api.sites.generate(site.id, { prompt: newSitePrompt })
      }

      navigate(`/editor/${site.id}`)
    } catch (err) {
      console.error('Failed to create site:', err)
      setCreating(false)
    }
  }

  const deleteSite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return
    try {
      await api.sites.delete(id)
      setSites(sites.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Failed to delete site:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="font-bold text-lg">SiteForge AI</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            New Site
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-blue-500" size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">No sites yet</h2>
            <p className="text-gray-500 mb-6">Create your first AI-powered website</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Create Your First Site
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        site.status === 'PUBLISHED'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {site.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 bg-black/30 rounded-md text-xs text-white font-mono">
                      {site._count.pages} pages
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg truncate">{site.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        site.aeoScore >= 80
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : site.aeoScore >= 60
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        AEO {site.aeoScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{site.slug}.siteforge.ai</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/editor/${site.id}`)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/settings/${site.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/aeo/${site.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                    >
                      <BarChart3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteSite(site.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Updated {formatDate(site.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Site</h2>
            <form onSubmit={createSite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Name</label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="My Business Website"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Describe your site (AI will generate everything)
                  </label>
                  <textarea
                    value={newSitePrompt}
                    onChange={(e) => setNewSitePrompt(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-none"
                    placeholder="A professional website for a local HVAC company in Austin, TX. Services include AC repair, heating installation, and maintenance."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
