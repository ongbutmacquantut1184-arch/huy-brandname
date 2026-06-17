"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus, Search, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '72px' : '220px');
  }, [isCollapsed]);

  const navItems = [
    { name: "Nhập phiếu hủy", path: "/nhap-huy", icon: FilePlus },
    { name: "Tra cứu", path: "/tra-cuu", icon: Search },
    { name: "Báo cáo", path: "/bao-cao", icon: BarChart3 }
  ];

  return (
    <aside style={{ 
      width: isCollapsed ? '72px' : '220px', 
      backgroundColor: 'var(--neutral-950)', 
      borderRight: '1px solid var(--neutral-200)', 
      padding: isCollapsed ? '24px 8px' : '24px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '36px', padding: isCollapsed ? '0' : '0 12px' }}>
        {!isCollapsed && (
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0, letterSpacing: '0.5px' }}>
              Brand<span style={{ color: 'var(--primary-500)' }}>name</span>
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--neutral-500)', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Quản lý Hủy</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ 
            background: 'var(--neutral-50)', 
            border: '1px solid var(--neutral-200)', 
            cursor: 'pointer', 
            color: 'var(--neutral-500)', 
            padding: '6px', 
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          className="sidebar-collapse-btn"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(item => {
          const isActive = pathname === item.path || (pathname === '/' && item.path === '/nhap-huy');
          const Icon = item.icon;
          return (
            <Link 
              key={item.path}
              href={item.path} 
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.name : undefined}
              style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            >
              <Icon size={isCollapsed ? 20 : 18} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          color: var(--neutral-600);
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition-fast);
          text-decoration: none;
          position: relative;
        }
        .sidebar-link:hover {
          background-color: var(--neutral-50);
          color: var(--neutral-900);
        }
        .sidebar-link.active {
          background-color: var(--primary-50);
          color: var(--primary-600);
          font-weight: 600;
        }
        .sidebar-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          height: 50%;
          width: 3px;
          background-color: var(--primary-500);
          border-radius: 0 4px 4px 0;
        }
        .sidebar-collapse-btn:hover {
          background-color: var(--neutral-200);
          color: var(--neutral-900);
        }
      `}} />
    </aside>
  );
}
