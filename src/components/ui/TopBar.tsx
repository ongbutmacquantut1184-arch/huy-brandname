"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";

export default function TopBar({ 
  onMenuClick, 
  onSearchClick 
}: { 
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const pathname = usePathname();
  
  // Tạo breadcrumb cơ bản từ pathname
  const getBreadcrumb = () => {
    if (pathname === '/cx/dashboard') return 'Tổng quan';
    if (pathname === '/cx/customers') return 'Khách hàng';
    if (pathname === '/cx/contracts') return 'Hợp đồng';
    if (pathname === '/cx/services') return 'Dịch vụ';
    if (pathname === '/cx/requests') return 'Yêu cầu (Tạo tài khoản)';
    if (pathname === '/cx/tao-phieu-sale') return 'Tạo phiếu Sale';
    if (pathname === '/cx/settings') return 'Cấu hình hệ thống';
    if (pathname === '/cx/history') return 'Lịch sử hoạt động';
    if (pathname === '/nhap-huy') return 'Nhập phiếu hủy';
    if (pathname === '/tra-cuu') return 'Tra cứu hủy';
    if (pathname === '/bao-cao') return 'Báo cáo hủy';
    return 'Hệ thống';
  };

  return (
    <header className="topbar" style={{
      height: 'var(--topbar-height)',
      background: '#ffffff',
      borderBottom: '1px solid var(--neutral-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* 7-Eleven Brand Stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', display: 'flex' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-orange)' }} />
        <div style={{ flex: 1, backgroundColor: 'var(--brand-red)' }} />
        <div style={{ flex: 1, backgroundColor: 'var(--brand-green)' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Mobile menu toggle */}
        <button 
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', 
            color: 'var(--neutral-600)', display: 'none' 
          }}
        >
          <Menu size={20} />
        </button>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--neutral-900)' }}>
          {getBreadcrumb()}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button 
          onClick={onSearchClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            color: 'var(--neutral-500)', fontSize: 'var(--text-sm)',
            cursor: 'text', minWidth: '240px'
          }}
        >
          <Search size={16} />
          <span>Tìm kiếm...</span>
          <span style={{ 
            marginLeft: 'auto', background: '#fff', 
            border: '1px solid var(--neutral-200)', borderRadius: '4px', 
            padding: '2px 6px', fontSize: '11px', fontWeight: 600 
          }}>
            Ctrl K
          </span>
        </button>

        <button style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          color: 'var(--neutral-500)', position: 'relative' 
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '8px', height: '8px', background: 'var(--error-500)',
            borderRadius: '50%', border: '2px solid #fff'
          }} />
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}} />
    </header>
  );
}
