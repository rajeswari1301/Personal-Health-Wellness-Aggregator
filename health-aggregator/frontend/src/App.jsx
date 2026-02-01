import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import DashboardSkeleton from './components/DashboardSkeleton'
import './index.css'

const THEME_KEY = 'health-aggregator-theme'

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [dashboardData, setDashboardData] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [correlations, setCorrelations] = useState([])
  const [insights, setInsights] = useState([])
  const [metricsHistory, setMetricsHistory] = useState([])
  const [healthScoreDetail, setHealthScoreDetail] = useState(null)
  const [anomalyTimeline, setAnomalyTimeline] = useState([])
  const [baselines, setBaselines] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const setThemeAndStore = (next) => {
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch (_) {}
  }

  const API_BASE = 'http://localhost:8000/api'

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoints = [
        ['dashboard', `${API_BASE}/dashboard/summary`],
        ['anomalies', `${API_BASE}/anomalies?limit=20`],
        ['correlations', `${API_BASE}/correlations?limit=10`],
        ['insights', `${API_BASE}/insights/ai`],
        ['history', `${API_BASE}/metrics/history?days=30`],
        ['healthScore', `${API_BASE}/health-score`],
        ['timeline', `${API_BASE}/anomalies/timeline?days=30`],
        ['baselines', `${API_BASE}/baselines`]
      ]

      const results = await Promise.allSettled(
        endpoints.map(([, url]) => fetch(url).then((r) => r.json()))
      )

      const [dashboard, anomaliesData, correlationsData, insightsData, historyPayload, healthScorePayload, timelinePayload, baselinesPayload] = results.map((r) => r.status === 'fulfilled' ? r.value : null)

      if (!dashboard) {
        setError('Failed to load dashboard. Is the backend running on port 8000?')
        return
      }

      setDashboardData(dashboard)
      setAnomalies(anomaliesData || [])
      setCorrelations(correlationsData || [])
      setInsights(insightsData?.insights || [])
      setMetricsHistory(historyPayload?.data || [])
      setHealthScoreDetail(healthScorePayload || null)
      setAnomalyTimeline(timelinePayload?.timeline || [])
      setBaselines(baselinesPayload?.baselines || {})
    } catch (err) {
      setError('Failed to connect to backend. Make sure the server is running on port 8000.')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: 20
      }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: 32,
          borderRadius: 12,
          border: '1px solid var(--accent-red)',
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: 16 }}>Connection Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button
            onClick={fetchAllData}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      data={dashboardData}
      anomalies={anomalies}
      correlations={correlations}
      insights={insights}
      metricsHistory={metricsHistory}
      healthScoreDetail={healthScoreDetail}
      anomalyTimeline={anomalyTimeline}
      baselines={baselines}
      onRefresh={fetchAllData}
      theme={theme}
      onThemeChange={setThemeAndStore}
    />
  )
}

export default App