import React, { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export default function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor, 
  onRowClick,
  isLoading = false
}: DataTableProps<T>) {
  
  if (isLoading) {
    return (
      <div className="card-container" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--neutral-400)' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-container" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <div style={{ color: 'var(--neutral-300)', marginBottom: 'var(--space-2)' }}>
          {/* Default Empty State */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neutral-600)' }}>Không có dữ liệu</h3>
      </div>
    );
  }

  return (
    <div className="card-container" style={{ overflowX: 'auto', padding: 0 }}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                style={{ 
                  width: col.width, 
                  textAlign: col.align || 'left',
                  position: 'sticky', top: 0, zIndex: 10,
                  backgroundColor: 'var(--neutral-50)'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr 
              key={keyExtractor(row, rIdx)}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} style={{ textAlign: col.align || 'left' }}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(row) 
                    : (row[col.accessor] as unknown as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
