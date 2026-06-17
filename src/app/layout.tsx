import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-primary",
});

export const metadata: Metadata = {
  title: "Quản lý Hủy Brandname",
  description: "Hệ thống quản lý hủy Brandname tốc độ cao",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body style={{ display: 'flex', minHeight: '100vh', margin: 0, fontFamily: 'var(--font-primary)' }}>
        
        <Sidebar />

        {/* Main Content */}
        <main className="main-content" style={{ 
          flex: 1, 
          marginLeft: 'var(--sidebar-width, 260px)', 
          backgroundColor: 'var(--neutral-50)', 
          minHeight: '100vh',
          padding: '32px 48px',
          transition: 'margin-left 0.3s ease'
        }}>
          {children}
        </main>
        
      </body>
    </html>
  );
}
