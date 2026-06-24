import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Toaster } from "@/components/ui/sonner";
import { PWAProvider } from "@/components/PWAProvider";

export const metadata: Metadata = {
  title: "Talita Kum Clínica",
  description: "Sistema de registro de intervenciones clínicas Talita Kum",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Talita Kum",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fontOutfit.variable} ${fontInter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWAProvider>
          {children}
        </PWAProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}

