import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "GardenFood",
  title: {
    default: "GardenFood — tu huerto frutal, por comuna",
    template: "%s · GardenFood",
  },
  description:
    "Cuándo podar, regar y qué fertilizante necesita tu tierra: consejos agronómicos por comuna para Chile.",
  keywords: [
    "huerto",
    "frutales",
    "agronomía",
    " Chile",
    "comuna",
    "podar",
    "regar",
    "fertilizante",
  ],
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "/",
    siteName: "GardenFood",
    title: "GardenFood — tu huerto frutal, por comuna",
    description:
      "Consejos agronómicos por comuna para tu huerto frutal en Chile.",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "GardenFood" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GardenFood — tu huerto frutal, por comuna",
    description:
      "Consejos agronómicos por comuna para tu huerto frutal en Chile.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "GardenFood",
    statusBarStyle: "default",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GardenFood",
  url: SITE_URL,
  description:
    "Consejos agronómicos por comuna para tu huerto frutal en Chile.",
  logo: `${SITE_URL}/icon.png`,
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
