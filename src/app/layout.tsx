import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planfinity",
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
      <body>{children}</body>
    </html>
  );
}
