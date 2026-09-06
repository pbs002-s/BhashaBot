/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
    optimizePackageImports: ['@phosphor-icons/react', '@phosphor-icons/react/dist/ssr'],
  },
};
export default nextConfig;
