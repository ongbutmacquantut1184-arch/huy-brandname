"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus, Search, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '180px');
  }, [isCollapsed]);

  const navItems = [
    { name: "Nhập phiếu hủy", path: "/nhap-huy", icon: FilePlus },
    { name: "Tra cứu", path: "/tra-cuu", icon: Search },
    { name: "Báo cáo", path: "/bao-cao", icon: BarChart3 }
  ];

  return (
    <aside style={{ 
      width: isCollapsed ? '64px' : '180px', 
      backgroundColor: 'var(--apple-white)', 
      borderRight: '1px solid var(--apple-gray-4)', 
      padding: isCollapsed ? '24px 8px' : '24px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      transition: 'all 0.3s ease',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '32px', padding: isCollapsed ? '0' : '0 12px' }}>
        {!isCollapsed && (
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--apple-black)', margin: 0 }}>Brandname</h1>
            <p style={{ fontSize: '13px', color: 'var(--apple-gray-1)', margin: '4px 0 0 0' }}>Quản lý Hủy</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-gray-1)', padding: '4px', borderRadius: '6px' }}
          className="hover-bg-gray"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
              <Icon size={isCollapsed ? 22 : 18} />
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
          padding: 10px 12px;
          border-radius: var(--apple-radius-sm);
          color: var(--apple-gray-1);
          font-size: 15px;
          font-weight: 500;
          transition: var(--apple-transition);
          text-decoration: none;
        }
        .sidebar-link:hover {
          background-color: var(--apple-gray-4);
          color: var(--apple-black);
        }
        .sidebar-link.active {
          background-color: rgba(0, 122, 255, 0.1);
          color: var(--apple-blue);
        }
        .hover-bg-gray:hover {
          background-color: var(--apple-gray-4);
        }
      `}} />
    </aside>
  );
}
