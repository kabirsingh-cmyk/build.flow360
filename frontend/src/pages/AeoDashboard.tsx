import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { cn, getAeoScoreColor, getAeoScoreLabel } from '../lib/utils'

export default function AeoDashboard() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    loadScore()
  }, [siteId])

  const loadScore = async () => {
    try {
      const res = await api.aeo.getScore(siteId!)
      setScore(res.data)
    } catch (err) {
      console.error('Failed to load AEO score:', err)
    } finally {
      setLoading(false)
    }
  }

  const regenerateSchema = async () => {
    setRegenerating(true)
    try {
      await api.aeo.generateSchema(siteId!)
      await loadScore()
      alert('Schema regenerated!')
    } catch (err) {
      console.error('Failed to regenerate schema:', err)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading AEO data...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(`/editor/${siteId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-lg">AEO Dashboard</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">AEO Score</h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-bold" style={{ color: score?.overall >= 80 ? '#10B981' : score?.overall >= 60 ? '#F59E0B' : '#EF4444' }}>
                  {score?.overall || 0}
                </span>
                <span className="text-lg font-medium text-gray-500">/ 100</span>
              </div>
              <p className="text-sm mt-1" style={{ color: score?.overall >= 80 ? '#10B981' : score?.overall >= 60 ? '#F59E0B' : '#EF4444' }}>
                {getAeoScoreLabel(score?.overall || 0)}
              </p>
            </div>
            <button
              onClick={regenerateSchema}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={cn(regenerating && 'animate-spin')} />
              {regenerating ? 'Regenerating...' : 'Regenerate Schema'}
            </button>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-5 gap-4">
            {score?.breakdown && Object.entries(score.breakdown).map(([key, value]: [string, any]) => (
              <div key={key} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl font-bold mb-1" style={{ color: value >= 15 ? '#10B981' : value >= 10 ? '#F59E0B' : '#EF4444' }}>{value}</div>
                <div className="text-xs text-gray-500 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            Recommendations
          </h2>
          
          {score?.recommendations && score.recommendations.length > 0 ? (
            <div className="space-y-3">
              {score.recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <AlertCircle size={18} className={cn(
                    'mt-0.5',
                    rec.priority === 'high' ? 'text-red-500' : 'text-yellow-500'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rec.message}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{rec.category} • {rec.priority} priority</p>
                  </div>
                  <button className="text-xs text-blue-500 hover:text-blue-600 font-medium whitespace-nowrap">
                    Fix Now
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle size={20} className="text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">Your site is fully optimized! No recommendations at this time.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
