import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
    <html lang="vi">
      <body style={{ display: 'flex', minHeight: '100vh', margin: 0 }}>
        
        <Sidebar />

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          marginLeft: '260px', 
          backgroundColor: 'var(--apple-bg)', 
          minHeight: '100vh',
          padding: '32px 48px'
        }}>
          {children}
        </main>
        
      </body>
    </html>
  );
}
