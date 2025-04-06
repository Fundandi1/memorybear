import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from '@/context/CartContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoryBear | Håndlavede bamser med minder",
  description: "MemoryBear skaber håndlavede, skræddersyede bamser fra dine kære tekstiler. Forvandl din elskede tøj til et varigt minde.",
  keywords: ["memory bear", "memorybear", "custom teddy bear", "keepsake bear", "memorial bear", "bamse med minder"],
  authors: [{ name: "MemoryBear Team" }],
  creator: "MemoryBear",
  publisher: "MemoryBear ApS",
  openGraph: {
    title: "MemoryBear | Håndlavede bamser med minder",
    description: "Skræddersyede bamser lavet af dit kære tøj - perfekt til at bevare særlige minder.",
    url: "https://memorybear.dk",
    siteName: "MemoryBear",
    locale: "da_DK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
