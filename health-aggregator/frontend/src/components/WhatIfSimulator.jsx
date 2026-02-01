import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles, Moon, Footprints, Flame, Zap, Brain, Loader2, RotateCcw, AlertTriangle } from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'
const DEBOUNCE_MS = 300
const CONTRIBUTION_EPS = 0.01 // treat |contrib| < this as zero for display

const SLIDER_CONFIG = {
  sleep_hours_delta: {
    min: -2.5,
    max: 2.5,
    step: 0.25,
    label: 'Sleep',
    unit: 'hrs',
    displayUnit: 'hrs',
    icon: Moon,
    color: '#8b5cf6'
  },
  steps_delta: {
    min: -5000,
    max: 5000,
    step: 500,
    label: 'Steps',
    unit: '',
    displayUnit: 'steps',
    icon: Footprints,
    color: '#10b981'
  },
  calories_in_delta: {
    min: -500,
    max: 500,
    step: 50,
    label: 'Calories in',
    unit: 'kcal',
    displayUnit: 'kcal',
    icon: Flame,
    color: '#ec4899'
  }
}

const formatDelta = (value, displayUnit) => {
  const num = Number(value)
  const sign = num > 0 ? '+' : num < 0 ? '-' : ''
  const display = Number.isInteger(num) ? String(Math.abs(num)) : Math.abs(num).toFixed(1)
  const u = displayUnit ? ` ${displayUnit}` : ''
  return `${sign}${display}${u}`
}

const getSliderDeltaColor = (key, value) => {
  const v = Number(value)
  if (v === 0) return 'var(--text-muted)'
  if (key === 'calories_in_delta') {
    if (v > 0) return '#10b981'
    return 'var(--text-muted)'
  }
  return v > 0 ? '#10b981' : '#ef4444'
}

const WhatIfSimulator = ({ apiBase = API_BASE }) => {
  const [deltas, setDeltas] = useState({
    sleep_hours_delta: 0,
    steps_delta: 0,
    calories_in_delta: 0
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFirstFetch = useRef(true)

  const fetchSimulation = useCallback(async (currentDeltas) => {
    try {
      setError(null)
      const params = new URLSearchParams({
        sleep_hours_delta: String(currentDeltas.sleep_hours_delta),
        steps_delta: String(currentDeltas.steps_delta),
        calories_in_delta: String(currentDeltas.calories_in_delta)
      })
      const res = await fetch(`${apiBase}/ml/simulate?${params}`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || `Request failed: ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err?.message ?? String(err) ?? 'Simulation failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    setLoading(true)
    const delay = isFirstFetch.current ? 0 : DEBOUNCE_MS
    if (isFirstFetch.current) isFirstFetch.current = false
    const t = setTimeout(() => fetchSimulation(deltas), delay)
    return () => clearTimeout(t)
  }, [deltas, fetchSimulation])

  const handleSliderChange = (key, value) => {
    setDeltas((prev) => ({ ...prev, [key]: Number(value) }))
  }

  const handleReset = () => {
    setDeltas({
      sleep_hours_delta: 0,
      steps_delta: 0,
      calories_in_delta: 0
    })
  }

  const energyDelta = result?.delta?.energy ?? 0
  const stressDelta = result?.delta?.stress ?? 0
  const energyBetter = energyDelta > 0
  const stressBetter = stressDelta < 0

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: '1px solid var(--border-color)',
      padding: 20,
      transition: 'background 0.3s ease, border-color 0.3s ease',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
        gap: 12
      }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-primary)'
      }}>
          <Sparkles size={20} color="#f59e0b" />
          What-If Simulator
        </h2>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
          title="Reset sliders to zero"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.4 }}>
        Drag sliders to see predicted energy and stress. Based on your latest day.
      </p>

      {error && (
        <div style={{
          background: '#ef444420',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          fontSize: 14,
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        {Object.entries(SLIDER_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          const value = deltas[key]
          return (
            <div key={key}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} color={config.color} />
                  {config.label} {config.unit && `(${config.unit})`}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: getSliderDeltaColor(key, value),
                  minWidth: 72,
                  textAlign: 'right'
                }}>
                  {formatDelta(value, config.displayUnit ?? config.unit)}
                </span>
              </div>
              <input
                className="whatif-slider"
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(e) => handleSliderChange(key, e.target.value)}
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  accentColor: config.color,
                  cursor: 'pointer'
                }}
              />
            </div>
          )
        })}
      </div>

      <div style={{
        background: 'var(--bg-inner)',
        borderRadius: 10,
        border: '1px solid var(--border-color)',
        padding: 16
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
            <Loader2 size={20} color="#3b82f6" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Predicting…</span>
          </div>
        ) : result ? (
          <>
            {/* 3. Drift detector: model outside training distribution */}
            {result.drift && !result.drift.in_domain && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: '#f59e0b18',
                border: '1px solid #f59e0b',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16
              }}>
                <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Model operating outside training distribution
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {result.drift.message ?? 'Recent data differs from training distribution.'}
                  </p>
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 1fr 70px',
              gap: 12,
              alignItems: 'center',
              marginBottom: 10,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              <span />
              <span>Baseline</span>
              <span>What-if</span>
              <span style={{ textAlign: 'right' }}>Δ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 1fr 70px',
                gap: 12,
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={16} color="#3b82f6" />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Energy</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {result.baseline?.energy?.toFixed(1) ?? '—'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {result.counterfactual?.energy?.toFixed(1) ?? '—'}
                  {result.confidence?.energy_std != null && result.confidence.energy_std > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
                      ± {result.confidence.energy_std}
                    </span>
                  )}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: energyDelta === 0 ? 'var(--text-muted)' : energyBetter ? '#10b981' : '#ef4444',
                  textAlign: 'right',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: energyDelta === 0 ? 'transparent' : energyBetter ? '#10b98120' : '#ef444420',
                  transition: 'background 0.2s ease'
                }}>
                  {energyDelta === 0 ? '—' : (energyDelta > 0 ? '+' : '') + energyDelta.toFixed(1)}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 1fr 70px',
                gap: 12,
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brain size={16} color="#f59e0b" />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Stress</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {result.baseline?.stress?.toFixed(1) ?? '—'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {result.counterfactual?.stress?.toFixed(1) ?? '—'}
                  {result.confidence?.stress_std != null && result.confidence.stress_std > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
                      ± {result.confidence.stress_std}
                    </span>
                  )}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: stressDelta === 0 ? 'var(--text-muted)' : stressBetter ? '#10b981' : '#ef4444',
                  textAlign: 'right',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: stressDelta === 0 ? 'transparent' : stressBetter ? '#10b98120' : '#ef444420',
                  transition: 'background 0.2s ease'
                }}>
                  {stressDelta === 0 ? '—' : (stressDelta > 0 ? '+' : '') + stressDelta.toFixed(1)}
                </span>
              </div>
            </div>

            {/* 1. Feature contributions (SHAP-lite): why did energy/stress change? */}
            {result.explanation && (energyDelta !== 0 || stressDelta !== 0) && (
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Change breakdown
                </div>
                {energyDelta !== 0 && result.explanation.energy && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Energy:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 13 }}>
                      {[
                        { key: 'sleep_hours', label: 'sleep', val: result.explanation.energy.sleep_hours },
                        { key: 'steps', label: 'steps', val: result.explanation.energy.steps },
                        { key: 'calories_in', label: 'calories', val: result.explanation.energy.calories_in }
                      ].filter(({ val }) => val != null && Math.abs(val) >= CONTRIBUTION_EPS).map(({ label, val }) => (
                        <span
                          key={label}
                          style={{
                            color: val > 0 ? '#10b981' : '#ef4444',
                            fontWeight: 500,
                            background: val > 0 ? '#10b98118' : '#ef444418',
                            padding: '2px 8px',
                            borderRadius: 6
                          }}
                        >
                          {val > 0 ? '+' : ''}{val.toFixed(1)} from {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {stressDelta !== 0 && result.explanation.stress && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Stress:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 13 }}>
                      {[
                        { key: 'sleep_hours', label: 'sleep', val: result.explanation.stress.sleep_hours },
                        { key: 'steps', label: 'steps', val: result.explanation.stress.steps },
                        { key: 'calories_in', label: 'calories', val: result.explanation.stress.calories_in }
                      ].filter(({ val }) => val != null && Math.abs(val) >= CONTRIBUTION_EPS).map(({ label, val }) => (
                        <span
                          key={label}
                          style={{
                            color: val < 0 ? '#10b981' : '#ef4444',
                            fontWeight: 500,
                            background: val < 0 ? '#10b98118' : '#ef444418',
                            padding: '2px 8px',
                            borderRadius: 6
                          }}
                        >
                          {val > 0 ? '+' : ''}{val.toFixed(1)} from {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.model_info && (
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--border-color)',
                fontSize: 12,
                color: 'var(--text-muted)'
              }}>
                Model R²: Energy {((result.model_info.energy_r2 ?? 0) * 100).toFixed(0)}% · Stress {((result.model_info.stress_r2 ?? 0) * 100).toFixed(0)}% · {result.model_info.training_rows} days
              </div>
            )}
          </>
        ) : !error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Adjust sliders to see predictions.
          </div>
        ) : null}
      </div>

      {/* Bottom: takeaway + visual comparison — fills empty space when we have results */}
      {result && !loading && (
        <div style={{ marginTop: 'auto', paddingTop: 20, flexShrink: 0 }}>
          <div style={{
            background: 'var(--bg-inner)',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            padding: 16
          }}>
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 16,
              lineHeight: 1.5
            }}>
              {energyDelta === 0 && stressDelta === 0
                ? 'These settings match your baseline — no change in predicted energy or stress.'
                : (() => {
                  const parts = []
                  if (energyDelta !== 0) parts.push(energyDelta > 0 ? 'Energy would improve.' : 'Energy would drop.')
                  if (stressDelta !== 0) parts.push(stressDelta < 0 ? 'Stress would improve.' : 'Stress would rise.')
                  const exp = result.explanation?.energy
                  if (exp && (exp.sleep_hours || exp.steps || exp.calories_in)) {
                    const byAbs = ['sleep_hours', 'steps', 'calories_in']
                      .map(k => ({ k, label: k === 'sleep_hours' ? 'sleep' : k === 'calories_in' ? 'calories' : 'steps', v: exp[k] }))
                      .filter(({ v }) => v != null && Math.abs(v) >= CONTRIBUTION_EPS)
                      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
                    if (byAbs[0]) parts.push(`Largest contribution: ${byAbs[0].label} ${byAbs[0].v > 0 ? '+' : ''}${byAbs[0].v.toFixed(1)}.`)
                  }
                  if (result.confidence?.energy_std > 0) parts.push(`Predictions have ±${result.confidence.energy_std} (energy) uncertainty.`)
                  return parts.join(' ')
                })()}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Energy', base: result.baseline?.energy ?? 0, cf: result.counterfactual?.energy ?? 0, baseColor: '#3b82f6', cfColor: '#10b981' },
                { label: 'Stress', base: result.baseline?.stress ?? 0, cf: result.counterfactual?.stress ?? 0, baseColor: '#f59e0b', cfColor: (result.counterfactual?.stress ?? 0) < (result.baseline?.stress ?? 0) ? '#10b981' : '#ef4444' }
              ].map(({ label, base, cf, baseColor, cfColor }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{label}</span>
                    <span>Baseline {base.toFixed(1)} → What-if {cf.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: '100%', height: 10, background: 'var(--border-color)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, base))}%`, height: '100%', background: baseColor, borderRadius: 5 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>base</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: '100%', height: 10, background: 'var(--border-color)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, cf))}%`, height: '100%', background: cfColor, borderRadius: 5 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 44 }}>what-if</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default WhatIfSimulator
