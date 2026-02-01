import { TrendingUp, TrendingDown, Link } from 'lucide-react'

const CorrelationChart = ({ correlations }) => {
  const getCorrelationColor = (coefficient) => {
    if (coefficient > 0.5) return '#10b981'
    if (coefficient > 0) return '#3b82f6'
    if (coefficient > -0.5) return '#f59e0b'
    return '#ef4444'
  }

  const formatMetricName = (metric) => {
    const names = {
      sleep: 'Sleep',
      heart_rate: 'Heart Rate',
      steps: 'Steps',
      stress: 'Stress',
      energy: 'Energy',
      nutrition: 'Nutrition'
    }
    return names[metric] || metric
  }

  return (
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
        <Link size={20} color="#3b82f6" />
        Discovered Correlations
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {correlations.slice(0, 5).map((correlation, index) => {
          const color = getCorrelationColor(correlation.correlation_coefficient)
          const isPositive = correlation.correlation_coefficient > 0
          
          return (
            <div
              key={correlation.id || index}
              style={{
                background: 'var(--bg-inner)',
                borderRadius: 8,
                padding: 14,
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Correlation Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid var(--border-color)'
                  }}>
                    {formatMetricName(correlation.metric_a)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>
                  <span style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid var(--border-color)'
                  }}>
                    {formatMetricName(correlation.metric_b)}
                  </span>
                  {correlation.description?.toLowerCase().includes('next-day') && (
                    <span style={{
                      background: '#3b82f620',
                      color: '#60a5fa',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      Next-day effect
                    </span>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: color
                }}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {(Math.abs(correlation.correlation_coefficient) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Correlation Bar */}
              <div style={{
                height: 6,
                background: 'var(--border-color)',
                borderRadius: 3,
                marginBottom: 10,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.abs(correlation.correlation_coefficient) * 100}%`,
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.5s ease'
                }} />
              </div>

              {/* Insight Text */}
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                {correlation.insight_text}
              </p>

              {/* Metadata */}
              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text-muted)'
              }}>
                Based on {correlation.sample_size} days of data • 
                Confidence: {(correlation.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>

      {correlations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          <Link size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No correlations discovered yet</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>Need more data to identify patterns</p>
        </div>
      )}
    </div>
  )
}

export default CorrelationChart