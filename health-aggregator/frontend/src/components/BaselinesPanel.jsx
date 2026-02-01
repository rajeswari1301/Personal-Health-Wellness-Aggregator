import { Target } from 'lucide-react'

const LABELS = {
  sleep_duration: 'Sleep (hrs)',
  sleep_quality: 'Sleep quality',
  resting_hr: 'Resting HR (bpm)',
  hrv: 'HRV (ms)',
  steps: 'Steps',
  stress_score: 'Stress',
  energy_level: 'Energy'
}

const DISPLAY_ORDER = ['sleep_duration', 'sleep_quality', 'resting_hr', 'steps', 'stress_score', 'energy_level']

const BaselinesPanel = ({ baselines = {} }) => {
  const entries = DISPLAY_ORDER
    .filter((key) => key !== 'hrv' && baselines[key] != null)
    .slice(0, 6)
    .map((key) => [key, baselines[key]])
  if (entries.length === 0) return null

  return (
    <div
      className="baselines-panel-right"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        padding: 20,
        transition: 'background 0.3s ease, border-color 0.3s ease',
        width: '100%',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
    >
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-primary)',
        marginBottom: 10
      }}>
        <Target size={20} color="#10b981" />
        Your normal ranges
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.4 }}>
        Personal baselines from your history. Anomalies are flagged when metrics fall outside these ranges.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          flex: 1,
          alignContent: 'start'
        }}
      >
        {entries.map(([key, b]) => (
          <div
            key={key}
            style={{
              background: 'var(--bg-inner)',
              padding: '10px 12px',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 0,
              border: '1px solid var(--border-color)'
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {LABELS[key] || key}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              avg <strong style={{ color: 'var(--text-primary)' }}>{b.mean}</strong>
              {' · '}{b.min_normal} – {b.max_normal}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BaselinesPanel
