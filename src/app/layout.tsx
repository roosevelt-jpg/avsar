import type { Metadata, Viewport } from 'next';
import {
  Schibsted_Grotesk,
  Noto_Sans_Devanagari,
  JetBrains_Mono,
  DM_Sans,
  DM_Serif_Display,
  Noto_Serif_Devanagari,
  Noto_Sans_Arabic,
} from 'next/font/google';
import './globals.css';

/**
 * Fonts are self-hosted through next/font rather than a Google Fonts <link>.
 * Many candidates are on slow mobile connections, so removing a render-blocking
 * third-party stylesheet round trip matters more here than usual.
 */
const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-schibsted',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

/**
 * Arabic, for the third locale.
 *
 * Chained into both the sans and the mono stacks rather than swapped in. A page
 * in Arabic still carries Latin strings: the company name, AED, an email
 * address, the dialling codes. Swapping the family would leave those to a
 * fallback and the two would not sit on the same baseline.
 */
const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/* Direction B typography, loaded only for the /b variant route. */
const bSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const bSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const bDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'S&A Recruitment · Work in the UAE',
    template: '%s · S&A Recruitment',
  },
  description:
    'A recruitment agency under the Smith & Adams brand, hiring worldwide for jobs in the United Arab Emirates. Assessment, contract, accommodation, meals and legal support through the whole visa process.',
  /* The canonical home. Every relative URL in metadata, including the Open
     Graph image and the canonical tag, is resolved against it, so a stale
     value here puts the preview URL on every card the brand shares. */
  metadataBase: new URL(process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com'),
  icons: {
    /* The favicon is a simplified mark with no dotted route, because the route
       turns to mud at 16px. The full mark is used everywhere it has room. */
    icon: [{ url: '/brand/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/app-icon-180.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',

  /* Resolved against `metadataBase`, so every route gets its own canonical
     rather than all of them claiming to be the home page. */
  alternates: { canonical: './' },

  /**
   * The card a shared link shows.
   *
   * This link travels by WhatsApp more than by anything else, to candidates
   * and to the people reviewing the business, and a link with no card reads as
   * broken or as something somebody pasted by accident. The image is a static
   * PNG rather than generated per request: one card for the whole site, and no
   * render to go wrong at the moment somebody is deciding whether to open it.
   */
  openGraph: {
    type: 'website',
    siteName: 'S&A Recruitment',
    title: 'Work in the UAE. We handle everything after you are selected.',
    description:
      'A professional assessment of your skills, experience and English. Selected candidates receive a contract with a UAE employer, accommodation, meals and legal support through the whole visa process.',
    url: './',
    images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: 'S&A Recruitment' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Work in the UAE. We handle everything after you are selected.',
    description:
      'A professional assessment of your skills, experience and English, and a contract, accommodation, meals and legal support for candidates who are selected.',
    images: ['/brand/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f5f0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${devanagari.variable} ${mono.variable} ${bSerif.variable} ${bSans.variable} ${bDevanagari.variable} ${arabic.variable}`}
      >
        {/* The scroll reveals start hidden and are uncovered by an observer,
            so without scripting they would never arrive. Crawlers run the
            script; a reader with it switched off should still get the page. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
