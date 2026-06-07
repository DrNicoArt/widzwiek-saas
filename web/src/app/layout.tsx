import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Widźwięk — zobacz to, co inni słyszą",
  description:
    "Inteligentny system napisów dostępnościowych dla polskiego audio i wideo. SubrosAI.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
