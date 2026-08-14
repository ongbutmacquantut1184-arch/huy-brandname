import React from 'react';

export default function SkeletonLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          style={{
            height: '24px',
            backgroundColor: 'var(--neutral-200)',
            borderRadius: '4px',
            width: `${Math.random() * (100 - 60) + 60}%`,
            animation: 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      ))}
    </div>
  );
}
