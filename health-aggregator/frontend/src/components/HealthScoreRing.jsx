import { useState, useEffect } from 'react'

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

const HealthScoreRing = ({ score = 0, size = 56, strokeWidth = 6, onClick, healthScoreDetail }) => {
  const [mounted, setMounted] = useState(false)
  const normalized = Math.min(100, Math.max(0, Number(score)))
  const targetScore = Math.round(normalized)
  const [displayScore, setDisplayScore] = useState(targetScore)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    if (displayScore === targetScore) return
    const step = displayScore < targetScore ? 1 : -1
    const id = setInterval(() => {
      setDisplayScore((prev) => {
        const next = prev + step
        if ((step > 0 && next >= targetScore) || (step < 0 && next <= targetScore)) return targetScore
        return next
      })
    }, 40)
    return () => clearInterval(id)
  }, [targetScore, displayScore])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (mounted ? (normalized / 100) * circumference : 0)
  const color = getScoreColor(normalized)
  const components = healthScoreDetail?.components ?? []
  const tooltipText = components.length
    ? components.map((c) => `${c.category}: ${c.score}`).join(', ')
    : `Health score: ${targetScore}`

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default'
      }}
      aria-label={`Health score ${targetScore}`}
      title={tooltipText}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out'
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.28,
          fontWeight: 700,
          color: color,
          transition: 'color 0.2s ease'
        }}
      >
        {displayScore}
      </div>
    </div>
  )
}

export default HealthScoreRing
