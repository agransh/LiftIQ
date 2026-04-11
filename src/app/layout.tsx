import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030305",
};

export const metadata: Metadata = {
  title: "LiftIQ — AI Form Coach",
  description:
    "Real-time AI-powered workout form analysis. Your camera is your coach.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiftIQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="noise min-h-[100dvh] bg-[#030305] text-zinc-200 overscroll-none selection:bg-cyan-500/20 selection:text-cyan-100">
        {/* Ambient radial glow */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-[-30%] left-[15%] h-[70vh] w-[70vh] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[10%] h-[50vh] w-[50vh] rounded-full bg-blue-500/[0.03] blur-[100px]" />
          <div className="absolute top-[40%] right-[30%] h-[30vh] w-[30vh] rounded-full bg-violet-500/[0.02] blur-[80px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
