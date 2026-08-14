import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-4) var(--space-6)',
      borderTop: '1px solid var(--neutral-200)',
      backgroundColor: '#ffffff',
      borderBottomLeftRadius: 'var(--radius-md)',
      borderBottomRightRadius: 'var(--radius-md)'
    }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-500)' }}>
        {totalItems !== undefined && (
          <span>Tổng số <strong style={{ color: 'var(--neutral-900)' }}>{totalItems}</strong> dòng</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{ ...btnStyle, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...btnStyle, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={16} />
        </button>
        
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neutral-700)', padding: '0 var(--space-3)' }}>
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...btnStyle, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{ ...btnStyle, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--neutral-200)',
  borderRadius: '4px',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--neutral-600)',
};
