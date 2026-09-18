import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "لوحة تحكم خزانة ليلك", template: "%s | لوحة تحكم خزانة ليلك" },
  description: "لوحة التحكم الداخلية لإدارة موقع خزانة ليلك (Lilac Drawer).",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-mauve-50 text-purple-deep">{children}</body>
    </html>
  );
}
