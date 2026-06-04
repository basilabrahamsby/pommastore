import type { Metadata } from "next";
import { Geist, Geist_Mono, Tenor_Sans, Cormorant_Garamond, Spectral } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tenorSans = Tenor_Sans({
  variable: "--font-tenor-sans",
  subsets: ["latin"],
  weight: ["400"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

// Dynamic Metadata Generator replacing static configuration
export async function generateMetadata(): Promise<Metadata> {
  let seo = {
    siteTitle: "Kozmocart | Luxury Fragrances",
    metaDescription: "Experience the art of fine perfumery with Kozmocart. Curated luxury fragrances for men and women.",
    indexingEnabled: true,
    googleConsoleId: ""
  };

  try {
    // Fetch directly from local network API (Docker service container communication)
    const res = await fetch("http://api:8000/api/v1/storefront/settings/storefront_layout", {
      cache: 'no-store' // Ensure fresh settings always propagate to bots
    });
    const data = await res.json();
    if (data.seo) {
      seo = { ...seo, ...data.seo };
    }
  } catch (err) {
    console.warn("SEO Generation engaged static failover defaults.");
  }

  return {
    title: seo.siteTitle,
    description: seo.metaDescription,
    robots: seo.indexingEnabled ? "index, follow" : "noindex, nofollow",
    verification: seo.googleConsoleId ? {
      google: seo.googleConsoleId
    } : undefined,
    icons: {
      icon: '/favicon.ico'
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${tenorSans.variable} ${cormorant.variable} ${spectral.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <SmoothScroll />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
