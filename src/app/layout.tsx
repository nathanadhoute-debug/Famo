import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "Famō — Coordination familiale pour vos proches",
  description: "Planning des visites, médicaments, journal partagé. Tout ce qui compte, au même endroit.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://famo.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
