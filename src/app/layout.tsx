import type { Metadata, Viewport } from "next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRIMETIME Check-in",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
