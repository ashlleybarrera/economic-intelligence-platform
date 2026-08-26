import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignorar errores de TypeScript al compilar en Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorar advertencias de ESLint (como variables sin usar o el uso de 'any')
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;