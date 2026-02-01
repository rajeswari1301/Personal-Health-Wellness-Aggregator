const SkeletonBox = ({ width = '100%', height = 24, style = {} }) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #2a2a3a 25%, #333348 50%, #2a2a3a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.2s ease-in-out infinite',
      borderRadius: 8,
      ...style
    }}
  />
)

const DashboardSkeleton = () => (
  <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
    <header style={{
      background: '#12121a',
      borderBottom: '1px solid #2a2a3a',
      padding: '16px 24px'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkeletonBox width={32} height={32} style={{ borderRadius: 8 }} />
          <div>
            <SkeletonBox width={220} height={20} style={{ marginBottom: 6 }} />
            <SkeletonBox width={180} height={14} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <SkeletonBox width={120} height={40} />
          <SkeletonBox width={90} height={40} />
        </div>
      </div>
    </header>
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBox key={i} height={100} />
        ))}
      </div>
      <div style={{ marginBottom: 24 }}>
        <SkeletonBox height={280} style={{ marginBottom: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <SkeletonBox height={400} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SkeletonBox height={200} />
          <SkeletonBox height={280} />
        </div>
      </div>
    </main>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
)

export default DashboardSkeleton
