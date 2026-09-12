export default function Loading(): React.JSX.Element {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#090d16',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px auto'
        }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Initializing PulseRender Dashboard…</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '8px' }}>Loading real-time engine & initial dataset</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
