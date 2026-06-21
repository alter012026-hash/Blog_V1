import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import config from "../site.config";

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
  },
  twitter: {
    card: "summary_large_image",
    site: config.seo.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang={config.language.toLowerCase()}>
      <head>
        {/* Aplica o tema salvo ANTES do primeiro paint, evitando flash de
            light→dark. Roda de forma síncrona e bloqueante (é o objetivo:
            é mais rápido decidir a cor agora do que renderizar errado e
            corrigir depois). Sem acesso a dados sensíveis, só localStorage. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {config.adsense.enabled && config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX" && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsense.publisherId}`}
            crossOrigin="anonymous"
          />
        )}
        {config.seo.googleSiteVerification && (
          <meta name="google-site-verification" content={config.seo.googleSiteVerification} />
        )}
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
