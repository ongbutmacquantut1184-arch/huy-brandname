import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalRecords, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && totalRecords === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid var(--neutral-200)', background: '#fff' }}>
      <div style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>
        Tổng cộng <strong style={{ color: 'var(--neutral-900)' }}>{totalRecords}</strong> bản ghi (Trang {currentPage}/{totalPages || 1})
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
            borderRadius: '6px', border: '1px solid var(--neutral-200)', background: currentPage <= 1 ? 'var(--neutral-50)' : '#fff',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? 'var(--neutral-400)' : 'var(--neutral-700)'
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
            borderRadius: '6px', border: '1px solid var(--neutral-200)', background: currentPage >= totalPages ? 'var(--neutral-50)' : '#fff',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? 'var(--neutral-400)' : 'var(--neutral-700)'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
