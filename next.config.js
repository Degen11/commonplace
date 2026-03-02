const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
