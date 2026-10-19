import type { Metadata, Viewport } from 'next';
import {
  Schibsted_Grotesk,
  Noto_Sans_Devanagari,
  JetBrains_Mono,
  DM_Sans,
  DM_Serif_Display,
  Noto_Serif_Devanagari,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from 'next/font/google';
import { getSiteSettings } from '@/lib/cms/data';
import { hasServiceRole, isSupabaseConfigured } from '@/lib/supabase/config';
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

/**
 * One face per Indian script the site now speaks. Urdu uses the Arabic face
 * above, and Assamese uses Bengali. `preload: false` so the English page does
 * not wait on fonts a visitor may never need.
 */
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '600'], variable: '--font-bengali', display: 'swap', preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ['gujarati'], weight: ['400', '600'], variable: '--font-gujarati', display: 'swap', preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ['gurmukhi'], weight: ['400', '600'], variable: '--font-gurmukhi', display: 'swap', preload: false });
const kannada = Noto_Sans_Kannada({ subsets: ['kannada'], weight: ['400', '600'], variable: '--font-kannada', display: 'swap', preload: false });
const malayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], weight: ['400', '600'], variable: '--font-malayalam', display: 'swap', preload: false });
const oriya = Noto_Sans_Oriya({ subsets: ['oriya'], weight: ['400', '600'], variable: '--font-oriya', display: 'swap', preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['400', '600'], variable: '--font-tamil', display: 'swap', preload: false });
const telugu = Noto_Sans_Telugu({ subsets: ['telugu'], weight: ['400', '600'], variable: '--font-telugu', display: 'swap', preload: false });
const indic = [bengali, gujarati, gurmukhi, kannada, malayalam, oriya, tamil, telugu].map((font) => font.variable).join(' ');

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

/**
 * Site-wide defaults, from Settings › General and Settings › Search & sharing.
 * Pages override them through `pageMetadata` in src/lib/seo.ts.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const { siteName } = settings.general;
  const { defaultTitle, defaultDescription, ogImage } = settings.seo;
  const images = ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: siteName }] : undefined;
  return {
    title: { default: defaultTitle, template: `%s · ${siteName}` },
    description: defaultDescription,
    applicationName: siteName,
    /* The canonical home. Every relative URL in metadata, including the Open
       Graph image and the canonical tag, is resolved against it, so a stale
       value here puts the preview URL on every card the brand shares. */
    metadataBase: new URL(process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com'),
    ...STATIC_METADATA,
    openGraph: { type: 'website', siteName, title: defaultTitle, description: defaultDescription, url: './', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title: defaultTitle, description: defaultDescription, images: images?.map((image) => image.url) },
  };
}

const STATIC_METADATA: Metadata = {
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f5' },
    { media: '(prefers-color-scheme: dark)', color: '#161513' },
  ],
};

/* Applies a stored light or dark choice before first paint, so a dark-mode
   visitor never sees a white flash. A fixed string written here, not content
   from anyone, which is why it may be inlined. */
const THEME_SCRIPT = "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.classList.add(t)}catch(e){}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* The theme script changes the class before React hydrates. */
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${sans.variable} ${devanagari.variable} ${arabic.variable} ${indic} ${mono.variable} ${bSerif.variable} ${bSans.variable} ${bDevanagari.variable}`}
      >
        {/* The scroll reveals start hidden and are uncovered by an observer,
            so without scripting they would never arrive. Crawlers run the
            script; a reader with it switched off should still get the page. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {isSupabaseConfigured() ? children : <SetupRequired />}
      </body>
    </html>
  );
}

/**
 * There is no demo mode: every page reads live data, so a deployment without
 * a database says what is missing rather than showing an empty site. Names the
 * variables only, never their values.
 */
function SetupRequired() {
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !hasServiceRole() && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean) as string[];
  return (
    <main className="mx-auto max-w-[60ch] px-6 py-16">
      <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">Setup required</h1>
      <p className="mt-4 text-[16px] leading-[1.6] text-ink-2">
        This site needs its database before it can show anything. Set these environment variables, run the
        migrations in <code>supabase/migrations</code> and the seeds in <code>supabase/seed</code>, then redeploy.
      </p>
      <ul className="mt-4 text-[15px]">
        {missing.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
