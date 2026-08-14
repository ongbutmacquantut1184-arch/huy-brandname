"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FilePlus, BarChart3, Settings, Users, Server, FileText } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // It's handled by parent usually, but just in case
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Tra cứu Khách hàng', path: '/cx/customers', icon: Users },
    { label: 'Tạo phiếu Sale (Yêu cầu DV)', path: '/cx/tao-phieu-sale', icon: FilePlus },
    { label: 'Duyệt yêu cầu (Tạo TK)', path: '/cx/requests', icon: Server },
    { label: 'Quản lý Hợp đồng', path: '/cx/contracts', icon: FileText },
    { label: 'Báo cáo hủy', path: '/bao-cao', icon: BarChart3 },
    { label: 'Cấu hình hệ thống', path: '/cx/settings', icon: Settings },
  ];

  const handleAction = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '100%', maxWidth: '600px', padding: 0, 
          overflow: 'hidden', marginTop: '-15vh'
        }}
      >
        <div style={{ 
          display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', 
          borderBottom: '1px solid var(--neutral-200)' 
        }}>
          <Search size={20} color="var(--neutral-500)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm mã KH, mã HĐ, tên công ty..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: 'var(--space-4)', border: 'none', 
              outline: 'none', fontSize: 'var(--text-lg)',
              fontFamily: 'var(--font-sans)', color: 'var(--neutral-900)'
            }}
          />
          <span style={{ 
            fontSize: 'var(--text-xs)', color: 'var(--neutral-400)', 
            background: 'var(--neutral-100)', padding: '2px 6px', 
            borderRadius: '4px' 
          }}>
            ESC
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', maxHeight: '360px', overflowY: 'auto' }}>
          <h3 style={{ 
            fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--neutral-500)', 
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' 
          }}>
            Truy cập nhanh
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {quickActions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase())).map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleAction(action.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    width: '100%', padding: 'var(--space-3) var(--space-4)',
                    background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
                    color: 'var(--neutral-700)', fontSize: 'var(--text-sm)',
                    fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    transition: 'var(--duration-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.color = 'var(--primary-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--neutral-700)';
                  }}
                >
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
