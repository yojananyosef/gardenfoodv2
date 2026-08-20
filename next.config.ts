import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    unoptimized: false,
  },
  // No CSP header for mercadopago secure-fields needed — hosted redirect has no inline Bricks.
};

export default nextConfig;
