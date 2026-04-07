import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { UMAMI_INSTANCE_URL, UMAMI_WEBSITE_ID } from "@/lib/umamiBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planfinity",
  icons: {
    icon: "/favicon.svg",
  },
  description:
    "Design Gridfinity drawer layouts fast, with live fit feedback and print-ready baseplate + bin suggestions.",
  metadataBase: new URL("https://planfinity.app"),
  openGraph: {
    title: "Planfinity",
    description:
      "Design Gridfinity drawer layouts fast, with live fit feedback and print-ready baseplate + bin suggestions.",
    url: "https://planfinity.app",
    siteName: "Planfinity",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Planfinity",
    description:
      "Design Gridfinity drawer layouts fast, with live fit feedback and print-ready baseplate + bin suggestions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script
          defer
          src={`${UMAMI_INSTANCE_URL}/script.js`}
          data-website-id={UMAMI_WEBSITE_ID}
        />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
