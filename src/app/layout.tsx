import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/app/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevStash",
  description: "Centralized developer knowledge hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Script
          src="https://umami.labnerd.net/script.js"
          data-website-id="b9db6dde-840d-4df2-b648-bf754933a148"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
