"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TopBar from "@/components/ui/TopBar";
import CommandPalette from "@/components/ui/CommandPalette";
import { AuthProvider } from "@/lib/AuthContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  
  // Theme color is now fixed to 7-Eleven branding via globals.css
  
  // Các trang không hiển thị sidebar (VD: Sale form dành cho user ngoài)
  const isNoSidebarPage = pathname === '/cx/sale';

  if (isNoSidebarPage) {
    return <main style={{ flex: 1, width: '100vw' }}>{children}</main>;
  }

  return (
    <AuthProvider>
      <div className="app-layout">
        <Sidebar 
          mobileOpen={isSidebarOpenMobile} 
          onCloseMobile={() => setIsSidebarOpenMobile(false)} 
        />
        <main className="main-content">
          <TopBar 
            onMenuClick={() => setIsSidebarOpenMobile(true)}
            onSearchClick={() => setIsCommandPaletteOpen(true)}
          />
          <div className="page-container">
            {children}
          </div>
        </main>
        
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
        />
      </div>
    </AuthProvider>
  );
}

