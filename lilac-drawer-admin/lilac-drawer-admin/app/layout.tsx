import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lilac Drawer Admin", template: "%s | Lilac Drawer Admin" },
  description: "Internal dashboard for running Lilac Drawer.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-mauve-50 text-purple-deep">{children}</body>
    </html>
  );
}
