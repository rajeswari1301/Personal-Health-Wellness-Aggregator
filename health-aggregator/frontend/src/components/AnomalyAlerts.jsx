import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react'

const AnomalyAlerts = ({ anomalies, highlightedDate, onHighlightClear }) => {
  const getDateStr = (timestamp) => {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    return d.toISOString().slice(0, 10)
  }
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertTriangle size={16} />,
          color: '#ef4444',
          bg: '#ef444415',
          label: 'CRITICAL'
        }
      case 'warning':
        return {
          icon: <AlertCircle size={16} />,
          color: '#f59e0b',
          bg: '#f59e0b15',
          label: 'WARNING'
        }
      default:
        return {
          icon: <Info size={16} />,
          color: '#3b82f6',
          bg: '#3b82f615',
          label: 'INFO'
        }
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const warningCount = anomalies.filter(a => a.severity === 'warning').length
  const infoCount = anomalies.filter(a => a.severity === 'info').length

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        padding: 20,
        height: 'fit-content',
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-primary)'
        }}>
          <AlertTriangle size={20} color="#ef4444" />
          Anomaly Alerts
        </h2>
        
        {/* Severity Summary */}
        <div style={{ display: 'flex', gap: 8 }}>
          {criticalCount > 0 && (
            <span style={{
              background: '#ef444420',
              color: '#ef4444',
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600
            }}>
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span style={{
              background: '#f59e0b20',
              color: '#f59e0b',
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600
            }}>
              {warningCount} Warning
            </span>
          )}
          {infoCount > 0 && (
            <span style={{
              background: '#3b82f620',
              color: '#3b82f6',
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600
            }}>
              {infoCount} Info
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxHeight: 500,
        overflowY: 'auto'
      }}>
        {anomalies.slice(0, 10).map((anomaly, index) => {
          const config = getSeverityConfig(anomaly.severity)
          const isHighlighted = highlightedDate && getDateStr(anomaly.timestamp) === highlightedDate
          return (
            <div
              key={anomaly.id || index}
              className={isHighlighted ? 'anomaly-card-highlighted' : ''}
              style={{
                background: isHighlighted ? 'var(--bg-hover)' : 'var(--bg-inner)',
                borderRadius: 8,
                padding: 14,
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${config.color}`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.stopPropagation()
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isHighlighted ? 'var(--bg-hover)' : 'var(--bg-inner)'
              }}
            >
              {/* Alert Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: config.bg,
                    color: config.color,
                    padding: '3px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {config.icon}
                    {config.label}
                  </span>
                  <span style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    border: '1px solid var(--border-color)'
                  }}>
                    {anomaly.metric_type}
                  </span>
                </div>
                <span style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Clock size={14} />
                  {formatDate(anomaly.timestamp)}
                </span>
              </div>

              {/* Alert Title */}
              <h4 style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6
              }}>
                {anomaly.title}
              </h4>

              {/* Alert Description */}
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: 8
              }}>
                {anomaly.description}
              </p>

              {/* Metrics */}
              <div style={{
                display: 'flex',
                gap: 16,
                fontSize: 13
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Deviation: <strong style={{ color: config.color }}>
                    {anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent?.toFixed(1)}%
                  </strong>
                </span>
                {anomaly.consecutive_days > 1 && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Persisted: <strong style={{ color: '#f59e0b' }}>
                      {anomaly.consecutive_days} days
                    </strong>
                  </span>
                )}
              </div>

              {/* Recommendation */}
              {anomaly.recommended_action && (
                <div style={{
                  marginTop: 10,
                  padding: 12,
                  background: 'var(--bg-inner)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)'
                }}>
                  💡 {anomaly.recommended_action}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {anomalies.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          <Info size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No anomalies detected</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>Your health metrics are within normal ranges</p>
        </div>
      )}
    </div>
  )
}

export default AnomalyAlerts