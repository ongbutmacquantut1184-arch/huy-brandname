import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Tự động suy luận variant dựa trên text nếu không được truyền
  let finalVariant: BadgeVariant = variant || 'default';
  
  if (!variant) {
    const s = status.toLowerCase();
    if (s.includes('hoạt động') || s.includes('active') || s.includes('thành công') || s.includes('success') || s.includes('đã duyệt')) {
      finalVariant = 'success';
    } else if (s.includes('chờ') || s.includes('pending') || s.includes('đang xử lý') || s.includes('cảnh báo')) {
      finalVariant = 'warning';
    } else if (s.includes('hủy') || s.includes('lỗi') || s.includes('error') || s.includes('từ chối') || s.includes('thất bại')) {
      finalVariant = 'error';
    } else if (s.includes('nháp') || s.includes('thông tin') || s.includes('info') || s.includes('mới')) {
      finalVariant = 'info';
    }
  }

  return (
    <span className={`badge-custom badge-${finalVariant}`}>
      {status}
    </span>
  );
}
