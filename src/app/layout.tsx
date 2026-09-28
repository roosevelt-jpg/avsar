import type { Metadata, Viewport } from 'next';
import {
  Schibsted_Grotesk,
  Noto_Sans_Devanagari,
  JetBrains_Mono,
  DM_Sans,
  DM_Serif_Display,
  Noto_Serif_Devanagari,
} from 'next/font/google';
import './globals.css';

/**
 * Fonts are self-hosted through next/font rather than a Google Fonts <link>.
 * Most candidates are on mobile data in India, so removing a render-blocking
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
    default: 'Avsar · India → Portugal talent and mobility',
    template: '%s · Avsar',
  },
  description:
    'A professional assessment of your skills, experience and English, with a verified profile in a talent pool employers in Portugal and Europe can search.',
  metadataBase: new URL('https://avsar.example'),
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
        className={`${sans.variable} ${devanagari.variable} ${mono.variable} ${bSerif.variable} ${bSans.variable} ${bDevanagari.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
