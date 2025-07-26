const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

const nextConfig = {
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
