import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* A lockfile in the home directory otherwise gets picked as the workspace
     root and file tracing walks the wrong tree. */
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
};

export default nextConfig;
