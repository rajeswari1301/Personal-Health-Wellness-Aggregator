const HealthMetricCard = ({ title, value, unit, subtitle, icon, color, compact }) => {
  const isCompact = !!compact
  return (
    <div
      className="health-metric-card-hover"
      style={{
        background: 'var(--bg-card)',
        borderRadius: isCompact ? 10 : 12,
        border: '1px solid var(--border-color)',
        padding: isCompact ? 12 : 20,
        cursor: 'default',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isCompact ? 6 : 12
      }}>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: isCompact ? 13 : 14,
          fontWeight: 500
        }}>
          {title}
        </span>
        <div style={{
          background: `${color}20`,
          padding: isCompact ? 6 : 8,
          borderRadius: isCompact ? 6 : 8,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ marginBottom: isCompact ? 2 : 4 }}>
        <span style={{
          fontSize: isCompact ? 24 : 28,
          fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontSize: isCompact ? 13 : 14,
            color: 'var(--text-muted)',
            marginLeft: 4
          }}>
            {unit}
          </span>
        )}
      </div>
      <p style={{
        fontSize: isCompact ? 13 : 14,
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        {subtitle}
      </p>
    </div>
  )
}
  
  export default HealthMetricCard