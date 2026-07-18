import type { Metadata } from "next";
import { Poppins, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

const poppins = Poppins({
  variable: "--font-poppins-next",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair-next",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat-next",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Dynamic Metadata Generator replacing static configuration
export async function generateMetadata(): Promise<Metadata> {
  let seo = {
    siteTitle: "Pomma | Luxury Fragrances",
    metaDescription: "Experience the art of fine perfumery with Pomma. Curated luxury fragrances for men and women.",
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
      icon: '/logo.png'
    }
  };
}

import { LanguageProvider } from "@/locales/i18nContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} ${montserrat.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <SmoothScroll />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
