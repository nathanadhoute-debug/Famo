import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["famo.app", "www.famo.app", "localhost:3000"],
      // Next.js limite le body des Server Actions à 1 Mo par défaut — bien en
      // dessous des 15 Mo autorisés pour un document ou d'une photo iPhone
      // (HEIC) typique, provoquant un crash serveur (413) au lieu de l'erreur
      // contrôlée attendue. Relevé à 16 Mo pour couvrir les deux cas.
      bodySizeLimit: "16mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  serverExternalPackages: ["stripe", "resend"],
};

export default nextConfig;
