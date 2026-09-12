'use client';

import { useEffect } from 'react';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#090d16',
      color: '#e2e8f0',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        padding: '32px',
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.25rem', color: '#f87171', fontWeight: '600', marginBottom: '12px' }}>
          Dashboard Runtime Error
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '24px' }}>
          {error.message || 'An unexpected error occurred while running the dashboard rendering pipeline.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 20px',
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
