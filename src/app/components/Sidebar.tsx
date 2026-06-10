"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus, Search, BarChart3 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Nhập phiếu hủy", path: "/nhap-huy", icon: FilePlus },
    { name: "Tra cứu", path: "/tra-cuu", icon: Search },
    { name: "Báo cáo", path: "/bao-cao", icon: BarChart3 }
  ];

  return (
    <aside style={{ 
      width: '260px', 
      backgroundColor: 'var(--apple-white)', 
      borderRight: '1px solid var(--apple-gray-4)', 
      padding: '24px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div style={{ padding: '0 12px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--apple-black)', margin: 0 }}>Brandname</h1>
        <p style={{ fontSize: '13px', color: 'var(--apple-gray-1)', margin: '4px 0 0 0' }}>Hệ thống quản lý Hủy</p>
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
            >
              <Icon size={18} />
              <span>{item.name}</span>
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
      `}} />
    </aside>
  );
}
