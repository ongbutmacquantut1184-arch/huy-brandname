import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-primary",
});

export const metadata: Metadata = {
  title: "CX All-in-one",
  description: "Hệ thống quản lý CX và Hủy Brandname",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body style={{ display: 'flex', minHeight: '100vh', margin: 0 }}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
