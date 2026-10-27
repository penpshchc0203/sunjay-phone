/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/sunjay-phone',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
