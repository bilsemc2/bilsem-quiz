/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Statik dosyaların yolunu yapılandır
  assetPrefix: '',
  // Resim optimizasyonunu devre dışı bırak (isteğe bağlı)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
