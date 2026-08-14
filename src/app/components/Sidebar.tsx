"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FilePlus, Search, BarChart3, ChevronLeft, ChevronRight, 
  Users, LayoutDashboard, UserPlus, FileText, Server, LogOut, UserCircle, History, X, Settings
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userEmail, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'
    );
  }, [isCollapsed]);

  useEffect(() => {
    async function fetchPending() {
      const { count } = await supabase.from('cx_services').select('*', { count: 'exact', head: true }).eq('trang_thai', 'Pending');
      setPendingCount(count || 0);
    }
    fetchPending();
    
    // Realtime subscription
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
        { name: "Khách hàng", path: "/cx/customers", icon: Users },
        { name: "Yêu cầu dịch vụ", path: "/cx/tao-phieu-sale", icon: FilePlus },
        { name: "Duyệt TK", path: "/cx/requests", icon: UserPlus },
        { name: "Hợp đồng", path: "/cx/contracts", icon: FileText },
        { name: "Dịch vụ", path: "/cx/services", icon: Server, badge: pendingCount > 0 ? pendingCount : null },
        { name: "Cấu hình", path: "/cx/settings", icon: Settings },
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
        { name: "Lịch sử", path: "/cx/history", icon: History }
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="modal-overlay"
          onClick={onCloseMobile} 
          style={{ zIndex: 45 }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`} style={{ 
        width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)', 
        backgroundColor: 'var(--neutral-50)', 
        borderRight: '1px solid var(--neutral-200)', 
        padding: isCollapsed ? 'var(--space-6) var(--space-2)' : 'var(--space-6) var(--space-4)', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        transition: 'width var(--duration-normal) var(--ease-out), transform var(--duration-normal)',
        zIndex: 50,
        overflowY: 'auto',
      }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          marginBottom: 'var(--space-8)', 
          padding: isCollapsed ? '0' : '0 var(--space-3)' 
        }}>
          {!isCollapsed && (
            <div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--neutral-900)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
                CX System
              </h1>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)', margin: '2px 0 0 0', fontWeight: 600 }}>All-in-one</p>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="collapse-btn hidden-mobile"
            style={{ 
              background: 'none', border: '1px solid var(--neutral-200)', 
              cursor: 'pointer', color: 'var(--neutral-500)', 
              padding: '4px', borderRadius: 'var(--radius-sm)' 
            }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          
          {mobileOpen && (
            <button onClick={onCloseMobile} style={{ background: 'none', border: 'none', padding: 4 }}>
               <X size={20} />
            </button>
          )}
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {!isCollapsed && (
                <div style={{ 
                  fontSize: '11px', fontWeight: 600, color: 'var(--neutral-500)', 
                  textTransform: 'uppercase', padding: '0 var(--space-3)', letterSpacing: '0.05em' 
                }}>
                  {group.title}
                </div>
              )}
              {isCollapsed && <div style={{ height: '1px', background: 'var(--neutral-200)', margin: 'var(--space-1) var(--space-3)' }} />}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map(item => {
                  const isActive = pathname === item.path || (pathname === '/' && item.path === '/cx/dashboard');
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.path}
                      href={item.path} 
                      onClick={onCloseMobile}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                      style={{ position: 'relative' }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      {!isCollapsed && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                          {(item as any).badge && (
                            <span className="badge-count">
                              {(item as any).badge}
                            </span>
                          )}
                        </div>
                      )}
                      {isCollapsed && (item as any).badge && (
                        <span className="badge-dot" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {/* THEME PICKER REMOVED */}
          
          {!isCollapsed ? (
            <div style={{ padding: 'var(--space-3)', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <UserCircle size={20} style={{ color: 'var(--neutral-500)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={userEmail || 'Chưa đăng nhập'}>
                  {userEmail || 'Đang chờ...'}
                </span>
              </div>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--error-600)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                <LogOut size={14} /> Đổi Email
              </button>
            </div>
          ) : (
            <button onClick={logout} title="Đổi Email" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', color: 'var(--error-600)', background: 'var(--neutral-100)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          )}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .sidebar-link {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: 10px 12px;
            border-radius: var(--radius-sm);
            color: var(--neutral-600);
            font-size: var(--text-sm);
            font-weight: 500;
            transition: var(--duration-fast);
            position: relative;
          }
          .sidebar-link:hover {
            background-color: var(--neutral-100);
            color: var(--neutral-900);
          }
          .sidebar-link.active {
            background-color: var(--primary-50);
            color: var(--primary-700);
            font-weight: 600;
          }
          .sidebar-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 6px;
            bottom: 6px;
            width: 4px;
            background: linear-gradient(to bottom, var(--brand-orange), var(--brand-red), var(--brand-green));
            border-radius: 4px;
          }
          .badge-count {
            background: var(--error-500);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 100px;
          }
          .badge-dot {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 8px;
            height: 8px;
            background: var(--error-500);
            border-radius: 50%;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar.mobile-open {
              transform: translateX(0);
            }
            .hidden-mobile {
              display: none !important;
            }
          }
        `}} />
      </aside>
    </>
  );
}
