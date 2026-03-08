import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { WorkspaceDock } from "@/components/layout/WorkspaceDock";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "KISAN-OS | Voice-Powered Intelligence for Every Farmer",
  description: "AI-powered agricultural platform with voice interface for Indian farmers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} relative min-h-screen bg-[#071714] text-white antialiased`}>
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        <WorkspaceDock />
        {children}
      </body>
    </html>
  );
}
