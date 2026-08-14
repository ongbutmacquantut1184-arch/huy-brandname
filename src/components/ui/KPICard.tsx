import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number; // e.g., 12.5 cho 12.5%
    isPositive: boolean;
  };
  color?: string; // Hex color for the icon background
}

export default function KPICard({ title, value, icon: Icon, trend, color = 'var(--primary-600)' }: KPICardProps) {
  return (
    <div className="card-container" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neutral-500)', margin: 0 }}>
          {title}
        </h3>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: 'var(--radius-md)', 
          background: `color-mix(in srgb, ${color} 10%, white)`,
          color: color, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--neutral-900)', letterSpacing: 'var(--tracking-tight)' }}>
          {value}
        </span>
        
        {trend && (
          <span style={{ 
            fontSize: 'var(--text-xs)', fontWeight: 600,
            color: trend.isPositive ? 'var(--success-600)' : 'var(--error-600)',
            display: 'flex', alignItems: 'center', gap: '2px',
            background: trend.isPositive ? 'var(--success-50)' : 'var(--error-50)',
            padding: '2px 6px', borderRadius: '4px'
          }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
