import React from 'react';

export default function SkeletonLoader({ rows = 5 }: { rows?: number }) {
  const widths = ['92%', '78%', '86%', '64%', '74%'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          style={{
            height: '24px',
            backgroundColor: 'var(--neutral-200)',
            borderRadius: '4px',
            width: widths[i % widths.length],
            animation: 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      ))}
    </div>
  );
}
