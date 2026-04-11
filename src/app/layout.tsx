import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Lift IQ — AI Workout Form Coach",
  description:
    "Real-time AI-powered workout form analysis. Get instant feedback on your exercise form, track reps, and improve with every session.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lift IQ",
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
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-[100dvh] bg-background text-foreground overscroll-none">
        {children}
      </body>
    </html>
  );
}
