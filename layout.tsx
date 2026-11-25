import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "الكناش | دفتر التاجر الذكي",
  description: "دفتر تجاري عربي لإدارة الصفقات والمصاريف الخفية وتسعير السلع حسب النشاط",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
