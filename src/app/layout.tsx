import type { Metadata } from "next";
import { Geist, Geist_Mono, Architects_Daughter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const architectsDaughter = Architects_Daughter({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "DSA Studio",
  description: "A comprehensive web-based teaching tool for Data Structures & Algorithms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${architectsDaughter.variable}`}>
        {children}
      </body>
    </html>
  );
}
