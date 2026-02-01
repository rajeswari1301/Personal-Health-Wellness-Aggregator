import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts'

const METRIC_COLORS = { sleep: '#8b5cf6', steps: '#10b981', resting_hr: '#ef4444' }

const formatDate = (str) => {
  const d = new Date(str)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const MetricsTrendChart = ({ history = [], anomalies = [] }) => {
  const chartData = history.map((record) => ({
    date: record.date,
    label: formatDate(record.date),
    sleep: record.sleep?.duration_hours ?? record.sleep_hours ?? 0,
    steps: record.activity?.steps ?? record.steps ?? 0,
    resting_hr: record.heart_rate?.resting ?? record.resting_heart_rate ?? 0
  })).filter((d) => d.sleep > 0 || d.steps > 0 || d.resting_hr > 0)

  const anomalyDates = [...new Set(
    (anomalies || [])
      .map((a) => {
        if (!a.timestamp) return null
        const d = new Date(a.timestamp)
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
      })
      .filter(Boolean)
  )]
  const anomalyLabels = anomalyDates.map((d) => formatDate(d))
  const anomalyLabelsInChart = anomalyLabels.filter((label) => chartData.some((d) => d.label === label))

  if (chartData.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        padding: 20,
        minHeight: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 14
      }}>
        <p>Not enough history yet. Check back after a few days of data.</p>
      </div>
    )
  }

  return (
    <div className="metrics-trend-chart" style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: '1px solid var(--border-color)',
      padding: 20
    }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 16,
        color: 'var(--text-primary)'
      }}>
        30-Day Trends — Sleep & Steps
        {anomalyLabelsInChart.length > 0 && (
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 8 }}>
            · Red markers = anomaly days
          </span>
        )}
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 12]}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-inner)',
              border: '1px solid var(--border-color)',
              borderRadius: 8
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value, name) => [
              name === 'sleep' ? `${Number(value).toFixed(1)} hrs` : value.toLocaleString(),
              name === 'sleep' ? 'Sleep' : 'Steps'
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => (value === 'sleep' ? 'Sleep (hrs)' : value === 'steps' ? 'Steps' : 'Anomaly day')}
            iconType="circle"
            iconSize={8}
            style={{ fontSize: 14 }}
          />
          {anomalyLabelsInChart.map((label) => (
            <ReferenceDot
              key={label}
              x={label}
              y={0}
              yAxisId="right"
              r={5}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sleep"
            stroke={METRIC_COLORS.sleep}
            strokeWidth={2}
            dot={{ fill: METRIC_COLORS.sleep, r: 3 }}
            activeDot={{ r: 5 }}
            name="sleep"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="steps"
            stroke={METRIC_COLORS.steps}
            strokeWidth={2}
            dot={{ fill: METRIC_COLORS.steps, r: 3 }}
            activeDot={{ r: 5 }}
            name="steps"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MetricsTrendChart
