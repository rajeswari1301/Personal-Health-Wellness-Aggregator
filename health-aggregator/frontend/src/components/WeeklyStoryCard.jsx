import { BookOpen } from 'lucide-react'

const WeeklyStoryCard = ({ insights = [], correlations = [], anomalies = [], healthScore }) => {
  const topInsight = insights.find((i) => i.category === 'recommendation') || insights[0]
  const topCorrelation = correlations[0]
  const anomalyCount = anomalies.length
  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length
  const warningCount = anomalies.filter((a) => a.severity === 'warning').length

  const summaryParts = []
  if (criticalCount > 0) summaryParts.push(`${criticalCount} critical alert${criticalCount > 1 ? 's' : ''}`)
  if (warningCount > 0) summaryParts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`)
  if (anomalyCount === 0) summaryParts.push('no anomalies this period')
  else if (summaryParts.length === 0) summaryParts.push(`${anomalyCount} minor variation${anomalyCount > 1 ? 's' : ''}`)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
      borderRadius: 12,
      border: '1px solid #2a2a3a',
      padding: 20
    }}>
      <h2 style={{
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#f0f0f5'
      }}>
        <BookOpen size={18} color="#8b5cf6" />
        Your health story this week
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#9090a0', lineHeight: 1.5 }}>
          Health score: <strong style={{ color: healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444' }}>{healthScore}</strong>
          {' · '}Alerts: {summaryParts.join(', ')}.
          {topCorrelation && (
            <> Key pattern: {topCorrelation.insight_text}</>
          )}
        </p>
        {topInsight && (
          <div style={{
            background: '#12121a',
            padding: 12,
            borderRadius: 8,
            borderLeft: '3px solid #8b5cf6'
          }}>
            <p style={{ fontSize: 13, color: '#c0c0d0', lineHeight: 1.5 }}>
              {topInsight.content}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyStoryCard
