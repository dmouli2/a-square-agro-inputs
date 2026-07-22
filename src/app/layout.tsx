import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "A Square Agro Inputs — Seeds, Fertilizers & Farm Essentials",
    template: "%s — A Square Agro Inputs",
  },
  description:
    "Genuine seeds, fertilizers, crop protection and farm tools — sourced from certified brands, priced fairly, and delivered to your village. Cash on delivery, no middlemen.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#159949",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
