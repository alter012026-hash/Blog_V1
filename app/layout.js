import "./styles/tokens.css";
import "./styles/chrome.css";
import "./styles/home.css";
import "./styles/article.css";
import "./styles/pages.css";
import "./styles/transitions.css";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import AdSenseScript from "../components/AdSenseScript";
import AnalyticsEvents from "../components/AnalyticsEvents";
import PageTransition from "../components/PageTransition";
import RouteProgress from "../components/RouteProgress";
import ViewTransitions from "../components/ViewTransitions";
import SideTicker from "../components/SideTicker";
import Header from "../components/Header";
import MobileDock from "../components/MobileDock";
import Footer from "../components/Footer";
import HideOn from "../components/HideOn";
import { getTickerItems } from "../lib/ticker-data";
import { getSearchIndex } from "../lib/search-index";
import config from "../site.config";

const isVercelProduction =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

// Fontes auto-hospedadas pelo Next (sem requisição a fonts.googleapis.com):
// a CSP do site só permite font-src 'self', então o @import antigo do
// Google Fonts era bloqueado e o site caía em Georgia/system-ui.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--f-display",
});
const read = Literata({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--f-read",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0D24" },
  ],
};

export const metadata = {
  title: { default: config.name, template: `%s | ${config.name}` },
  description: config.description,
  keywords: config.keywords,
  authors: [{ name: config.author.name }],
  creator: config.author.name,
  metadataBase: new URL(config.url),
  openGraph: {
    type: "website",
    locale: config.locale,
    url: config.url,
    siteName: config.name,
    description: config.description,
    images: [{ url: config.seo.ogImage, width: 1200, height: 630, alt: config.name }],
  },
  twitter: {
    card: "summary_large_image",
    images: [config.seo.ogImage],
    ...(config.seo.twitterHandle ? { site: config.seo.twitterHandle } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }) {
  const tickerItems = getTickerItems();
  const searchIndex = getSearchIndex();

  return (
    <html lang={config.language.toLowerCase()} className={`${display.variable} ${read.variable}`}>
      <head>
        {/* Tema salvo aplicado ANTES do primeiro paint (sem flash claro→escuro). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.setAttribute('data-theme',t);if(/^\\/(admin|simulado)(\\/|$)/.test(location.pathname)){d.setAttribute('data-nodock','');}}catch(e){}})();`,
          }}
        />
        {config.seo.googleSiteVerification && (
          <meta name="google-site-verification" content={config.seo.googleSiteVerification} />
        )}
      </head>
      <body>
        <AdSenseScript
          enabled={
            isVercelProduction &&
            config.adsense.enabled &&
            config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX"
          }
        />
        <RouteProgress />
        <ViewTransitions />
        <SideTicker items={tickerItems} />
        <Header posts={searchIndex} />
        <PageTransition>{children}</PageTransition>
        <HideOn paths={["/admin"]}>
          <Footer />
        </HideOn>
        <MobileDock />
        <AnalyticsEvents />
        {isVercelProduction && <Analytics />}
      </body>
    </html>
  );
}
