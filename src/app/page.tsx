import Link from "next/link";
import { Logo } from "@/components/Logo";
import { c, font } from "@/lib/theme";

export const metadata = {
  title: "Famō — Vieillir accompagné. Aider ensemble.",
};

const features = [
  { icon: "💚", title: "Santé suivie", text: "Tension, poids, glycémie, médicaments : les indicateurs qui comptent, à jour et partagés." },
  { icon: "🤝", title: "Relais organisé", text: "Qui passe voir maman cette semaine ? Un planning clair, sans se marcher dessus." },
  { icon: "📔", title: "Journal partagé", text: "Une note après chaque visite. Toute la famille reste au courant, en douceur." },
  { icon: "🗂️", title: "Coffre-fort", text: "Ordonnances, analyses, papiers importants réunis et accessibles quand il faut." },
  { icon: "🔔", title: "Rien d'oublié", text: "Médicaments du jour, prochaines visites, alertes : l'essentiel remonte tout seul." },
  { icon: "👪", title: "En cercle", text: "Invitez frères, sœurs et proches aidants. Chacun sa place, une seule source de vérité." },
];

const steps = [
  { n: "1", title: "Créez votre cercle", text: "Donnez-lui un nom — « Famille Dupont », « Chez Mamie »." },
  { n: "2", title: "Ajoutez votre proche", text: "Le parent dont vous prenez soin, au centre de tout." },
  { n: "3", title: "Invitez la famille", text: "Chacun rejoint le cercle et peut aider dès aujourd'hui." },
];

export default function LandingPage() {
  return (
    <div style={{ background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <style>{`
        .lp-header { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(10px);
          background: rgba(244,242,236,.8); border-bottom: 1px solid ${c.line}; }
        .lp-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .lp-nav-links { display: flex; gap: 28px; align-items: center; }
        .lp-nav-links a { color: ${c.muted}; font-size: 14.5px; font-weight: 500; transition: color .15s; }
        .lp-nav-links a:hover { color: ${c.sage900}; }
        .lp-nav-links a.btn-primary, .lp-nav-links a.btn-primary:hover { color: #fff; }
        .lp-hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: 56px; align-items: center;
          padding: 72px 0 88px; }
        .lp-h1 { font-family: ${font.display}; font-size: 54px; line-height: 1.05; font-weight: 600;
          color: ${c.sage900}; letter-spacing: -0.02em; margin: 0 0 20px; }
        .lp-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .lp-feat-card { transition: transform .18s, box-shadow .18s; }
        .lp-feat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(30,56,48,.10); }
        .lp-nav-cta { display: none !important; }
        @media (max-width: 860px) {
          .lp-hero { grid-template-columns: 1fr; gap: 36px; padding: 48px 0 60px; }
          .lp-h1 { font-size: 40px; }
          .lp-features { grid-template-columns: 1fr; }
          .lp-steps { grid-template-columns: 1fr; }
          .lp-nav-links { display: none; }
          .lp-nav-cta { display: inline-flex !important; }
        }
      `}</style>

      {/* Header ------------------------------------------------------ */}
      <header className="lp-header">
        <div className="lp-wrap" style={{ height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/"><Logo size={26} /></Link>
          <nav className="lp-nav-links">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#etapes">Comment ça marche</a>
            <Link href="/login">Se connecter</Link>
            <Link href="/signup" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: 14 }}>Commencer</Link>
          </nav>
          <Link href="/signup" className="btn btn-primary lp-nav-cta" style={{ padding: "9px 18px", fontSize: 14 }}>
            Commencer
          </Link>
        </div>
      </header>

      {/* Hero -------------------------------------------------------- */}
      <section className="lp-wrap">
        <div className="lp-hero">
          <div style={{ animation: "fadeUp .5s ease both" }}>
            <span className="badge" style={{ marginBottom: 22 }}>Coordination familiale · pour les aidants</span>
            <h1 className="lp-h1">Vieillir accompagné.<br /><em style={{ fontStyle: "italic", color: c.sage700 }}>Aider ensemble</em>.</h1>
            <p style={{ fontSize: 18, color: c.muted, lineHeight: 1.6, maxWidth: 480, marginBottom: 32 }}>
              Famō réunit toute la famille autour de votre proche : visites, médicaments,
              journal et documents. Fini les groupes de messages éparpillés.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/signup" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 16 }}>
                Créer notre cercle →
              </Link>
              <Link href="/login" className="btn btn-outline" style={{ padding: "14px 26px", fontSize: 16 }}>
                Se connecter
              </Link>
            </div>
            <p style={{ fontSize: 13, color: c.muted, marginTop: 18 }}>Gratuit pour commencer · Sans carte bancaire</p>
          </div>

          {/* Aperçu produit ---------------------------------------- */}
          <div style={{ animation: "fadeUp .6s ease .1s both" }}>
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Fonctionnalités -------------------------------------------- */}
      <section id="fonctionnalites" className="lp-wrap" style={{ padding: "40px 24px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 style={{ fontSize: 34, marginBottom: 12 }}>Tout ce qui compte, au même endroit</h2>
          <p style={{ color: c.muted, fontSize: 17, maxWidth: 540, margin: "0 auto" }}>
            Une application pensée pour le parent âgé comme pour ses enfants aidants
          </p>
        </div>
        <div className="lp-features">
          {features.map((f) => (
            <div key={f.title} className="card lp-feat-card" style={{ padding: 26 }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 19, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: c.muted, fontSize: 14.5 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche ------------------------------------------ */}
      <section id="etapes" style={{ background: c.sage050, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <div className="lp-wrap" style={{ padding: "72px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, marginBottom: 12 }}>Prêt en trois minutes</h2>
            <p style={{ color: c.muted, fontSize: 17 }}>Trois étapes, et votre famille est reliée.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s) => (
              <div key={s.n} style={{ textAlign: "center", padding: "0 8px" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: c.sage700, color: "#fff",
                  fontFamily: font.display, fontSize: 24, fontWeight: 600,
                  display: "grid", placeItems: "center", margin: "0 auto 18px",
                }}>{s.n}</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: c.muted, fontSize: 15 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final -------------------------------------------------- */}
      <section style={{ background: c.sage900 }}>
        <div className="lp-wrap" style={{ padding: "72px 24px", textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: 36, marginBottom: 16 }}>Rassemblez votre famille aujourd'hui</h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: 18, maxWidth: 500, margin: "0 auto 32px" }}>
            Créez votre cercle, invitez vos proches, et prenez soin ensemble de ceux qui comptent.
          </p>
          <Link href="/signup" className="btn" style={{ background: "#fff", color: c.sage900, padding: "15px 30px", fontSize: 16 }}>
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* Footer ----------------------------------------------------- */}
      <footer className="lp-wrap" style={{ padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Logo size={22} />
        <p style={{ color: c.muted, fontSize: 13.5 }}>
          © {new Date().getFullYear()} Famō · famo.health · Fait avec soin en France ·{" "}
          <Link href="/confidentialite" style={{ color: c.muted, textDecoration: "underline" }}>Confidentialité</Link>
        </p>
      </footer>
    </div>
  );
}

/* Aperçu stylisé du dashboard, purement décoratif (pas de données réelles). */
function HeroPreview() {
  const rows: [string, string, boolean][] = [
    ["Amlodipine", "8h00", true],
    ["Metformine", "12h00", true],
    ["Doliprane", "20h00", false],
  ];
  return (
    <div className="card" style={{ padding: 20, boxShadow: "0 20px 60px rgba(30,56,48,.16)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: font.display, fontSize: 18, color: c.sage900, fontWeight: 600 }}>Aujourd'hui</p>
          <p style={{ color: c.muted, fontSize: 13 }}>Chez Mamie · lundi</p>
        </div>
        <span className="badge">3 aidants</span>
      </div>

      <div style={{ background: c.cream, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 10 }}>💊 MÉDICAMENTS DU JOUR</p>
        {rows.map(([n, t, done], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <span style={{
              width: 18, height: 18, borderRadius: 6, flexShrink: 0,
              background: done ? c.sage700 : "#fff", border: `1.5px solid ${done ? c.sage700 : c.line}`,
              display: "grid", placeItems: "center", color: "#fff", fontSize: 11,
            }}>{done ? "✓" : ""}</span>
            <span style={{ fontSize: 14, color: c.ink, flex: 1, textDecoration: done ? "line-through" : "none", opacity: done ? .55 : 1 }}>{n}</span>
            <span style={{ fontSize: 13, color: c.muted }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: c.sage050, borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 22, fontFamily: font.display, color: c.sage900, fontWeight: 600 }}>12.8</p>
          <p style={{ fontSize: 12, color: c.muted }}>Tension · stable</p>
        </div>
        <div style={{ flex: 1, background: c.sage050, borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 22, fontFamily: font.display, color: c.sage900, fontWeight: 600 }}>Mer.</p>
          <p style={{ fontSize: 12, color: c.muted }}>Visite · Sophie</p>
        </div>
      </div>
    </div>
  );
}
