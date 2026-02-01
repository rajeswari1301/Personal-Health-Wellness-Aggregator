import { useState, useRef, useEffect } from 'react'
import { Activity, Heart, Moon, Footprints, Brain, Zap, RefreshCw, Shield, Sun } from 'lucide-react'
import HealthMetricCard from './HealthMetricCard'
import AnomalyAlerts from './AnomalyAlerts'
import CorrelationChart from './CorrelationChart'
import MetricsTrendChart from './MetricsTrendChart'
import HealthScoreBreakdown from './HealthScoreBreakdown'
import HealthScoreRing from './HealthScoreRing'
import AnomalyTimeline from './AnomalyTimeline'
import BaselinesPanel from './BaselinesPanel'
import WhatIfSimulator from './WhatIfSimulator'

const Dashboard = ({
  data,
  anomalies = [],
  correlations = [],
  insights = [],
  metricsHistory = [],
  healthScoreDetail,
  anomalyTimeline = [],
  baselines = {},
  onRefresh,
  theme = 'dark',
  onThemeChange
}) => {
  const [refreshing, setRefreshing] = useState(false)
  const [highlightedDate, setHighlightedDate] = useState(null)
  const anomalyAlertsRef = useRef(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 500)
  }

  const toggleTheme = () => {
    onThemeChange?.(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (highlightedDate && anomalyAlertsRef.current) {
      anomalyAlertsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [highlightedDate])

  const metrics = data?.current_metrics || {}
  const healthScore = data?.health_score ?? healthScoreDetail?.overall_score ?? 0

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-primary)', transition: 'background 0.3s ease' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}>
        <div
          className="dashboard-header-row"
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={28} color="var(--accent-blue)" />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                Health & Wellness Aggregator
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Unified dashboard · Anomaly detection · Correlations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <HealthScoreRing
              score={healthScore}
              size={52}
              strokeWidth={5}
              healthScoreDetail={healthScoreDetail}
            />
            <HealthScoreBreakdown healthScoreDetail={healthScoreDetail} fallbackScore={healthScore} />
            {onThemeChange && (
              <button
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: refreshing ? 0.7 : 1
              }}
            >
              <RefreshCw size={16} style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - page ends after two-column section */}
      <main className="dashboard-main" style={{ maxWidth: 1400, margin: '0 auto', padding: 24, paddingBottom: 24 }}>
        {/* Metrics - 6 in one row, compact */}
        <div
          className="dashboard-metrics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 20
          }}
        >
          <HealthMetricCard
            compact
            title="Sleep"
            value={metrics.sleep_hours?.toFixed(1) || '0'}
            unit="hrs"
            subtitle={`Quality: ${metrics.sleep_quality || 0}%`}
            icon={<Moon size={16} />}
            color="#8b5cf6"
          />
          <HealthMetricCard
            compact
            title="Heart Rate"
            value={metrics.resting_heart_rate || 0}
            unit="bpm"
            subtitle={`HRV: ${metrics.hrv?.toFixed(0) || 0} ms`}
            icon={<Heart size={16} />}
            color="#ef4444"
          />
          <HealthMetricCard
            compact
            title="Steps"
            value={(metrics.steps || 0).toLocaleString()}
            unit=""
            subtitle={`${metrics.active_minutes || 0} active mins`}
            icon={<Footprints size={16} />}
            color="#10b981"
          />
          <HealthMetricCard
            compact
            title="Stress"
            value={metrics.stress_level || 0}
            unit="/100"
            subtitle={metrics.stress_level > 50 ? 'Elevated' : 'Normal'}
            icon={<Brain size={16} />}
            color="#f59e0b"
          />
          <HealthMetricCard
            compact
            title="Energy"
            value={metrics.energy_level || 0}
            unit="/100"
            subtitle={metrics.energy_level > 60 ? 'Good' : 'Low'}
            icon={<Zap size={16} />}
            color="#3b82f6"
          />
          <HealthMetricCard
            compact
            title="Calories"
            value={(metrics.calories_burned || 0).toLocaleString()}
            unit="kcal"
            subtitle={`In: ${(metrics.calories_consumed || 0).toLocaleString()}`}
            icon={<Activity size={16} />}
            color="#ec4899"
          />
        </div>

        {/* Trend chart - full width */}
        <div style={{ marginBottom: 20 }}>
          <MetricsTrendChart history={metricsHistory} anomalies={anomalies} />
        </div>

        {/* Anomaly timeline (SIEM-style) */}
        {(anomalyTimeline.length > 0 || anomalies.length > 0) && (
          <div style={{ marginBottom: 20 }}>
            <AnomalyTimeline
              timeline={anomalyTimeline}
              anomalies={anomalies}
              onDayClick={(date) => setHighlightedDate(date)}
            />
          </div>
        )}

        {/* Two Column Layout - both columns same height, no gap at bottom */}
        <div
          className="dashboard-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            alignItems: 'stretch',
            alignContent: 'stretch',
          }}
        >
          {/* Left: Anomaly Alerts, What-If Simulator - column stretches to match right, What-If fills remaining space */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0, height: '100%' }}>
            <div ref={anomalyAlertsRef} style={{ flexShrink: 0 }}>
              <AnomalyAlerts
                anomalies={anomalies}
                highlightedDate={highlightedDate}
                onHighlightClear={() => setHighlightedDate(null)}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <WhatIfSimulator />
              </div>
            </div>
          </div>

          {/* Right: AI Insights, Discovered Correlations, Your normal ranges - column stretches to match left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0, height: '100%' }}>
            {/* AI Insights */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              border: '1px solid var(--border-color)',
              padding: 20,
              transition: 'background 0.3s ease, border-color 0.3s ease'
            }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-primary)'
              }}>
                <Brain size={20} color="var(--accent-purple)" />
                AI Insights
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(insights || []).slice(0, 3).map((insight, i) => (
                  <div
                    key={insight?.id ?? i}
                    style={{
                      background: 'var(--bg-inner)',
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      borderLeft: '3px solid var(--accent-purple)'
                    }}
                  >
                    <h4 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                      {insight.title}
                    </h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <CorrelationChart correlations={correlations} />

            {Object.keys(baselines).length > 0 ? (
              <BaselinesPanel baselines={baselines} />
            ) : (
              <div style={{ flex: 1, minHeight: 0 }} aria-hidden="true" />
            )}
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Dashboard