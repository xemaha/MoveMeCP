import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { UserProvider } from "@/lib/UserContext";
import { BottomNavBar } from "@/components/BottomNavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "MoveMe",
  description: "Filme bewerten und entdecken",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/buttons/00_logo_bild_square.png" },
    { rel: "apple-touch-icon", url: "/buttons/00_logo_bild_square.png" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/buttons/00_logo_bild_square.png" />
        <link rel="apple-touch-icon" href="/buttons/00_logo_bild_square.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <div className="min-h-screen pb-20">{/* Platz für BottomNavBar */}
            {children}
          </div>
          <BottomNavBar />
        </UserProvider>
      </body>
    </html>
  );
}
