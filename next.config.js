/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["postgres"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
