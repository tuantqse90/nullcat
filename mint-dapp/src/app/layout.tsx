import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { CHAIN_LABEL } from "@/lib/chains";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: `AvaxCats Mint — Team1 VN · ${CHAIN_LABEL}`,
  description: `NFT mint demo on ${CHAIN_LABEL} — Team Avalanche (Team1 VN) academy.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
