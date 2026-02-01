import { useState } from 'react'
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

const HealthScoreBreakdown = ({ healthScoreDetail, fallbackScore }) => {
  const [expanded, setExpanded] = useState(false)
  const overall_score = healthScoreDetail?.overall_score ?? fallbackScore ?? 0
  const components = healthScoreDetail?.components ?? []
  const trend = healthScoreDetail?.trend
  const trend_percentage = healthScoreDetail?.trend_percentage ?? 0

  if (overall_score === 0 && !components.length) return null

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      padding: '10px 14px',
      minWidth: 140,
      transition: 'background 0.3s ease, border-color 0.3s ease'
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          gap: 8
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Health Score</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            color: getScoreColor(overall_score)
          }}>
            {overall_score}
          </span>
          {trend && trend !== 'stable' && (
            <span style={{
              fontSize: 11,
              color: trend === 'up' ? '#10b981' : '#ef4444'
            }}>
              {trend === 'up' ? '↑' : '↓'} {Math.abs(trend_percentage || 0).toFixed(0)}%
            </span>
          )}
          {components.length > 0 && (expanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />)}
        </div>
      </button>

      {expanded && components.length > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BarChart3 size={14} color="var(--accent-blue)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>By category</span>
          </div>
          {components.map((c) => (
            <div key={c.category} style={{ marginBottom: 10 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 4
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{c.category}</span>
                <span style={{ color: getScoreColor(c.score), fontWeight: 600 }}>{c.score}</span>
              </div>
              <div style={{
                height: 6,
                background: 'var(--border-color)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${c.score}%`,
                  background: getScoreColor(c.score),
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HealthScoreBreakdown
