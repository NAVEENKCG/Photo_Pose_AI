/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow LAN devices (phone preview) to connect to the dev server
  allowedDevOrigins: ['192.168.1.9'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
