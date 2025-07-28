const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

const nextConfig = {
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
    devIndicators: false,
    experimental: {
        viewTransition: true,
    },
    trailingSlash: true,
    images: {
        unoptimized: true
    }
};

module.exports = withPWA(nextConfig)
