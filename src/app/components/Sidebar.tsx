"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FilePlus, Search, BarChart3, ChevronLeft, ChevronRight, 
  Users, LayoutDashboard, UserPlus, FileText, Server, LogOut, UserCircle, History
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userEmail, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '72px' : '240px');
  }, [isCollapsed]);

  useEffect(() => {
    async function fetchPending() {
      const { count } = await supabase.from('cx_services').select('*', { count: 'exact', head: true }).eq('trang_thai', 'Pending');
      setPendingCount(count || 0);
    }
    fetchPending();
    
    // Đăng ký realtime lắng nghe thay đổi
    const channel = supabase.channel('pending_services_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cx_services' }, () => {
        fetchPending();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const menuGroups = [
    {
      title: "Quản lý khách hàng",
      items: [
        { name: "Tổng quan", path: "/cx/dashboard", icon: LayoutDashboard },
        { name: "Tra cứu Khách hàng", path: "/cx/customers", icon: Search },
        { name: "Yêu cầu dịch vụ (Sale)", path: "/cx/tao-phieu-sale", icon: FilePlus },
        { name: "Tạo tài khoản", path: "/cx/requests", icon: UserPlus },
        { name: "Hợp đồng", path: "/cx/contracts", icon: FileText },
        { name: "Dịch vụ", path: "/cx/services", icon: Server, badge: pendingCount > 0 ? pendingCount : null },
        { name: "Cấu hình hệ thống", path: "/cx/settings", icon: Server },
      ]
    },
    {
      title: "Quản lý hủy",
      items: [
        { name: "Nhập phiếu hủy", path: "/nhap-huy", icon: FilePlus },
        { name: "Tra cứu", path: "/tra-cuu", icon: Search },
        { name: "Báo cáo", path: "/bao-cao", icon: BarChart3 }
      ]
    },
    {
      title: "Hệ thống",
      items: [
        { name: "Lịch sử hoạt động", path: "/cx/history", icon: History }
      ]
    }
  ];

  return (
    <aside style={{ 
      width: isCollapsed ? '72px' : '240px', 
      backgroundColor: 'var(--neutral-100)', 
      borderRight: '1px solid var(--neutral-200)', 
      padding: isCollapsed ? '24px 8px' : '24px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      transition: 'var(--transition-normal)',
      zIndex: 100,
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '32px', padding: isCollapsed ? '0' : '0 12px' }}>
        {!isCollapsed && (
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>CX System</h1>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>All-in-one</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)', padding: '6px', borderRadius: '6px' }}
          className="hover-bg-gray"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', padding: '0 12px', letterSpacing: '0.5px' }}>
                {group.title}
              </div>
            )}
            {isCollapsed && <div style={{ height: '1px', background: 'var(--neutral-200)', margin: '4px 12px' }} />}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map(item => {
                const isActive = pathname === item.path || (pathname === '/' && item.path === '/cx/dashboard');
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    href={item.path} 
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                    style={{ position: 'relative' }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                        {(item as any).badge && (
                          <span style={{ background: 'var(--error-500)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '100px' }}>
                            {(item as any).badge}
                          </span>
                        )}
                      </div>
                    )}
                    {isCollapsed && (item as any).badge && (
                      <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: 'var(--error-500)', borderRadius: '50%' }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* THEME PICKER */}
        {!isCollapsed && (
          <div style={{ padding: '0 12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Màu Giao Diện
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['#24b47e', '#0070f3', '#f5a623', '#e30000', '#6366f1'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    document.documentElement.style.setProperty('--primary-600', color);
                    document.documentElement.style.setProperty('--primary-700', color);
                    localStorage.setItem('theme-color', color);
                  }}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: color, border: 'none', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                  title="Đổi màu"
                />
              ))}
              <input 
                type="color" 
                onChange={(e) => {
                    const color = e.target.value;
                    document.documentElement.style.setProperty('--primary-600', color);
                    document.documentElement.style.setProperty('--primary-700', color);
                    localStorage.setItem('theme-color', color);
                }}
                style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                title="Màu tùy chỉnh"
              />
            </div>
          </div>
        )}
        {!isCollapsed ? (
          <div style={{ padding: '12px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCircle size={20} style={{ color: 'var(--neutral-500)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={userEmail || 'Chưa đăng nhập'}>
                {userEmail || 'Đang chờ...'}
              </span>
            </div>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--error-600)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <LogOut size={14} /> Đổi Email
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Đổi Email" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', color: 'var(--error-600)', background: 'var(--neutral-50)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: var(--neutral-600);
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition-fast);
          text-decoration: none;
        }
        .sidebar-link:hover {
          background-color: var(--neutral-50);
          color: var(--neutral-900);
        }
        .sidebar-link.active {
          background-color: color-mix(in srgb, var(--primary-600) 10%, transparent);
          color: var(--primary-600);
          font-weight: 600;
        }
        .hover-bg-gray:hover {
          background-color: var(--neutral-50);
        }
        aside::-webkit-scrollbar {
          width: 4px;
        }
        aside::-webkit-scrollbar-thumb {
          background: var(--neutral-300);
          border-radius: 4px;
        }
      `}} />
    </aside>
  );
}
