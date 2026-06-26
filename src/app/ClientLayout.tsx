"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "@/lib/AuthContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-600', savedColor);
      document.documentElement.style.setProperty('--primary-700', savedColor);
    }
  }, []);
  
  // Các trang không hiển thị sidebar (VD: Sale form dành cho user ngoài)
  const isNoSidebarPage = pathname === '/cx/sale';

  if (isNoSidebarPage) {
    return <main style={{ flex: 1, width: '100vw' }}>{children}</main>;
  }

  return (
    <AuthProvider>
      <Sidebar />
      <main className="main-content" style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width, 240px)', 
        backgroundColor: 'var(--neutral-50)', 
        minHeight: '100vh',
        padding: '32px 48px',
        transition: 'margin-left 0.3s ease'
      }}>
        {children}
      </main>
    </AuthProvider>
  );
}
