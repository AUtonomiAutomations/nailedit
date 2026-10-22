/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // keep the Chromium binary out of the webpack bundle (it ships as files next to the function)
  experimental: { serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'] },
};
export default nextConfig;
