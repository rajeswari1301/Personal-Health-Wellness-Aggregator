import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' }

const EVENT_LIST_INITIAL = 4

const AnomalyTimeline = ({ timeline = [], anomalies = [], onDayClick }) => {
  const [severityFilter, setSeverityFilter] = useState('all')
  const [showAllEvents, setShowAllEvents] = useState(false)

  const formatDateShort = (str) => {
    const d = new Date(str)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDayNum = (dateStr) => {
    const d = new Date(dateStr)
    return d.getDate()
  }

  const filteredAnomalies = severityFilter === 'all'
    ? (anomalies || [])
    : (anomalies || []).filter((a) => a.severity === severityFilter)

  if (!(timeline && timeline.length) && !(anomalies && anomalies.length)) return null

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: '1px solid var(--border-color)',
      padding: 16,
      transition: 'background 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Title + filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-primary)'
        }}>
          <ShieldAlert size={20} color="#ef4444" />
          Anomaly Timeline
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginRight: 2 }}>Filter:</span>
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: severityFilter === sev ? 'var(--accent-blue)' : 'var(--bg-hover)',
                color: severityFilter === sev ? '#fff' : 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {sev === 'all' ? 'All' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline + event list side by side */}
      {timeline.length > 0 ? (
        <div className="anomaly-timeline-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%', flex: 1, minHeight: 0 }}>
            {/* Chart lower, bigger, fills whole space */}
            <div style={{
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              marginTop: 28,
              marginBottom: 8,
              minHeight: 100
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                height: 72,
                width: '100%',
                minWidth: 0
              }}>
                {timeline.map((day) => {
                  const critical = day.critical || 0
                  const warning = day.warning || 0
                  const info = day.info || 0
                  const total = critical + warning + info
                  const hasAny = total > 0
                  const maxH = 56
                  const scale = hasAny ? Math.min(1, maxH / (total * 6)) : 0
                  const dayNum = getDayNum(day.date)
                  const showLabel = dayNum % 5 === 0 || dayNum === 1
                  return (
                    <div
                      key={day.date}
                      role={onDayClick ? 'button' : undefined}
                      title={`${formatDateShort(day.date)}: ${critical} critical, ${warning} warning, ${info} info${onDayClick ? ' — Click to scroll to alerts' : ''}`}
                      onClick={() => onDayClick?.(day.date)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                        cursor: onDayClick ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        alignItems: 'stretch',
                        height: 60,
                        width: '100%',
                        maxWidth: 36,
                        margin: '0 auto',
                        justifyContent: 'flex-end'
                      }}>
                        {hasAny ? (
                          <>
                            {info > 0 && (
                              <div style={{
                                height: info * 6 * scale || 3,
                                minHeight: 3,
                                background: '#3b82f6',
                                borderRadius: '3px 3px 0 0'
                              }} />
                            )}
                            {warning > 0 && (
                              <div style={{
                                height: warning * 6 * scale || 3,
                                minHeight: 3,
                                background: '#f59e0b'
                              }} />
                            )}
                            {critical > 0 && (
                              <div style={{
                                height: critical * 6 * scale || 3,
                                minHeight: 3,
                                background: '#ef4444',
                                borderRadius: '0 0 3px 3px'
                              }} />
                            )}
                          </>
                        ) : (
                          <div style={{
                            height: 4,
                            width: '60%',
                            alignSelf: 'center',
                            background: 'var(--border-color)',
                            borderRadius: 2
                          }} />
                        )}
                      </div>
                      {showLabel && (
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {dayNum}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Last 30 days at bottom */}
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0, fontWeight: 500, width: '100%', textAlign: 'center' }}>
              Last 30 days · click a day to jump to alerts
            </p>
          </div>
          {filteredAnomalies.length > 0 && (
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Recent</h3>
              <div style={{ maxHeight: showAllEvents ? 280 : 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(showAllEvents ? filteredAnomalies : filteredAnomalies.slice(0, EVENT_LIST_INITIAL)).map((a, i) => (
                  <div
                    key={a.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--bg-inner)',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${SEVERITY_COLORS[a.severity] || 'var(--text-muted)'}`
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, width: 48 }}>
                      {formatDateShort(a.timestamp)}
                    </span>
                    <span style={{
                      background: (SEVERITY_COLORS[a.severity] || '#6b6b7b') + '25',
                      color: SEVERITY_COLORS[a.severity],
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                      textTransform: 'uppercase'
                    }}>{a.severity}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                  </div>
                ))}
              </div>
              {filteredAnomalies.length > EVENT_LIST_INITIAL && (
                <button onClick={() => setShowAllEvents((s) => !s)} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 14, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                  {showAllEvents ? 'Show less' : `+${filteredAnomalies.length - EVENT_LIST_INITIAL} more`}
                </button>
              )}
            </div>
          )}
        </div>
      ) : filteredAnomalies.length > 0 ? (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Recent</h3>
          <div style={{ maxHeight: showAllEvents ? 280 : 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(showAllEvents ? filteredAnomalies : filteredAnomalies.slice(0, EVENT_LIST_INITIAL)).map((a, i) => (
              <div
                key={a.id || i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--bg-inner)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${SEVERITY_COLORS[a.severity] || 'var(--text-muted)'}`
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, width: 48 }}>{formatDateShort(a.timestamp)}</span>
                <span style={{ background: (SEVERITY_COLORS[a.severity] || '#6b6b7b') + '25', color: SEVERITY_COLORS[a.severity], padding: '2px 6px', borderRadius: 4, fontSize: 13, fontWeight: 600, flexShrink: 0, textTransform: 'uppercase' }}>{a.severity}</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
              </div>
            ))}
          </div>
          {filteredAnomalies.length > EVENT_LIST_INITIAL && (
            <button onClick={() => setShowAllEvents((s) => !s)} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 14, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
              {showAllEvents ? 'Show less' : `+${filteredAnomalies.length - EVENT_LIST_INITIAL} more`}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default AnomalyTimeline
