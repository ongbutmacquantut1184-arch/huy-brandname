import React, { ReactNode } from 'react';
import { Filter, Search } from 'lucide-react';

interface FilterBarProps {
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  children?: ReactNode; // Cho các bộ lọc dropdown/date picker bổ sung
  actions?: ReactNode; // Cho các nút tạo mới (Ví dụ: Thêm khách hàng)
}

export default function FilterBar({ 
  onSearch, 
  searchPlaceholder = "Tìm kiếm...", 
  searchValue,
  children,
  actions 
}: FilterBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-5)',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '300px' }}>
        {onSearch && (
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input 
              type="text"
              className="input-field"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        )}
        
        {children && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--neutral-200)', margin: '0 4px' }} />
            {children}
          </div>
        )}
      </div>
      
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
