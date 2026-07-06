import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Famō — Coordination familiale pour vos proches",
  description: "Planning des visites, médicaments, journal partagé. Tout ce qui compte pour prendre soin d'un parent âgé, au même endroit.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://famo.health"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
