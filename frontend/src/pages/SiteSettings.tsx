import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ArrowLeft, Save, Globe } from 'lucide-react'

export default function SiteSettings() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSite()
  }, [siteId])

  const loadSite = async () => {
    try {
      const res = await api.sites.get(siteId!)
      setSite(res.data)
    } catch (err) {
      console.error('Failed to load site:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.sites.update(siteId!, {
        name: site.name,
        description: site.description,
        industry: site.industry,
        location: site.location,
        metaTitle: site.metaTitle,
        metaDescription: site.metaDescription,
      })
      alert('Settings saved!')
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(`/editor/${siteId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-lg">Site Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              value={site?.name || ''}
              onChange={(e) => setSite({ ...site, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={site?.description || ''}
              onChange={(e) => setSite({ ...site, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input
                value={site?.industry || ''}
                onChange={(e) => setSite({ ...site, industry: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., hvac, restaurant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                value={site?.location || ''}
                onChange={(e) => setSite({ ...site, location: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Austin, TX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input
              value={site?.metaTitle || ''}
              onChange={(e) => setSite({ ...site, metaTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">{(site?.metaTitle || '').length}/60 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              value={site?.metaDescription || ''}
              onChange={(e) => setSite({ ...site, metaDescription: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">{(site?.metaDescription || '').length}/160 characters</p>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Globe size={16} className="text-gray-500" />
            <span className="text-sm text-gray-500">{site?.slug}.siteforge.ai</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}
