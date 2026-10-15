import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/* The project URL is inlined at build time, so the policy names the exact
   Supabase project when it is known and falls back to the platform wildcard
   in demo builds. Realtime needs the wss:// form of the same host. */
const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).host : '*.supabase.co';
  } catch {
    return '*.supabase.co';
  }
})();

/* Payment SDKs run in the page (EximPe, Cashfree) or open their own frame
   (Razorpay). Stripe, Viva and Dodo are full-page redirects, which CSP does not
   restrict. Turnstile loads a script and a challenge frame from Cloudflare. */
const PAYMENT_SCRIPTS = ['https://cdn.eximpe.com', 'https://sdk.cashfree.com', 'https://checkout.razorpay.com'];
const PAYMENT_FRAMES = ['https://*.eximpe.com', 'https://*.cashfree.com', 'https://api.razorpay.com', 'https://checkout.razorpay.com'];
const PAYMENT_CONNECT = ['https://*.eximpe.com', 'https://*.cashfree.com', 'https://*.razorpay.com'];
const TURNSTILE = 'https://challenges.cloudflare.com';

/* Next.js injects inline bootstrap scripts, and a nonce would force every page
   to render dynamically, so 'unsafe-inline' stays for scripts. Everything else
   is pinned. Dev adds eval and the HMR websocket. CMS editors can point media
   at any https URL, which is why img-src and media-src allow https:. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${[...PAYMENT_SCRIPTS, TURNSTILE].join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} ${PAYMENT_CONNECT.join(' ')} ${TURNSTILE}${isDev ? ' ws: http://localhost:*' : ''}`,
  `frame-src https://www.youtube-nocookie.com ${[...PAYMENT_FRAMES, TURNSTILE].join(' ')}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* A lockfile in the home directory otherwise gets picked as the workspace
     root and file tracing walks the wrong tree. */
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
