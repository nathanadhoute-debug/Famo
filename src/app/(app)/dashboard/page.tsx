import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membershipRaw } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membershipRaw) redirect("/onboarding");
  const membership = membershipRaw as { family_id: string; role: string };

  const { data: familyRaw } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", membership.family_id)
    .single();
  const family = familyRaw as { id: string; name: string } | null;
  if (!family) redirect("/onboarding");

  const { data: parentRaw } = await supabase
    .from("parents").select("id, name").eq("family_id", family.id).single();
  const parent = parentRaw as { id: string; name: string } | null;

  const [{ data: dosesRaw }, { data: visitsRaw }, { data: membersRaw }] = await Promise.all([
    supabase.from("today_doses").select("*").eq("family_id", family.id).order("scheduled_time"),
    supabase.from("week_visits").select("*").eq("family_id", family.id).order("visit_date"),
    supabase.from("family_members").select("user_id, role, profiles(full_name)").eq("family_id", family.id),
  ]);

  const doses   = (dosesRaw   ?? []) as any[];
  const visits  = (visitsRaw  ?? []) as any[];
  const members = (membersRaw ?? []) as any[];

  const givenCount = doses.filter(d => d.given).length;
  const overdue    = doses.filter(d => !d.given && d.is_overdue);
  const gaps       = visits.filter(v => !v.visitor_id && v.day_offset >= 0);
  const COLORS     = ["#3A6B5E","#B07830","#3468A0","#7B5EA7","#A84848"];

  return (
    <div style={{ minHeight:"100vh",background:"#F4F2EC",
      fontFamily:"'Inter',system-ui,sans-serif",color:"#1A2622" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}a{text-decoration:none;color:inherit;}
        .nav-link{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;font-size:13.5px;font-weight:500;color:rgba(255,255,255,0.6);transition:all .15s;}
        .nav-link:hover{background:rgba(255,255,255,0.08);color:#fff;}
        .nav-link.active{background:rgba(255,255,255,0.13);color:#fff;font-weight:600;}
      `}</style>

      <div style={{ display:"flex",minHeight:"100vh" }}>
        <aside style={{ width:220,background:"#1E3830",color:"#fff",padding:"22px 14px",
          display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:22 }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#3A6B5E"/>
              <path d="M14 21c-.35 0-.7-.13-.96-.37C9.9 17.4 7.75 15.4 7.75 13 7.75 11.07 9.3 9.5 11.2 9.5c1.04 0 2.04.5 2.8 1.3.76-.8 1.76-1.3 2.8-1.3 1.9 0 3.45 1.57 3.45 3.5 0 2.4-2.15 4.4-5.29 7.13-.26.24-.6.37-.96.37z" fill="white"/>
            </svg>
            <span style={{ fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:600 }}>Famō</span>
          </div>
          <div style={{ background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px",marginBottom:18 }}>
            <div style={{ fontWeight:600,fontSize:13 }}>{family.name}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2 }}>
              {membership.role === "admin" ? "Administrateur" : "Membre"}
            </div>
          </div>
          <nav style={{ display:"flex",flexDirection:"column",gap:2 }}>
            {([["⬡","Accueil","/dashboard"],["♡","Santé","/dashboard/sante"],
              ["◷","Relais","/dashboard/relais"],["✎","Journal","/dashboard/journal"],
              ["📁","Documents","/dashboard/documents"],["⚙","Réglages","/dashboard/reglages"]] as const)
              .map(([icon, label, href]) => (
              <a key={href} href={href} className={`nav-link ${href==="/dashboard"?"active":""}`}>
                <span style={{ fontSize:15,width:18,textAlign:"center" }}>{icon}</span>{label}
              </a>
            ))}
          </nav>
        </aside>

        <main style={{ flex:1,padding:"28px 28px 60px",maxWidth:860 }}>
          {/* Hero */}
          <div style={{ background:"#1E3830",borderRadius:20,padding:"26px 26px 22px",color:"#fff",marginBottom:16 }}>
            <div style={{ fontSize:11.5,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5 }}>
              {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
            </div>
            <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:600,letterSpacing:"-0.02em",marginBottom:6 }}>
              Bonjour 👋
            </h1>
            <p style={{ fontSize:14.5,color:"rgba(255,255,255,0.6)",marginBottom:20 }}>
              {overdue.length===0&&gaps.length===0
                ? `Tout est en ordre pour ${parent?.name ?? "votre proche"} aujourd'hui.`
                : `${overdue.length+gaps.length} point(s) à régler pour ${parent?.name ?? "votre proche"}.`}
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
              {[{ label:"Médicaments",val:`${givenCount}/${doses.length}`,sub:"donnés ce jour" },
                { label:"Visites",val:`${visits.filter(v=>v.visitor_id).length}/7`,sub:"jours couverts" },
                { label:"Alertes",val:`${overdue.length+gaps.length}`,sub:"points à régler" }]
                .map(s=>(
                <div key={s.label} style={{ background:"rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",minWidth:120 }}>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:500,color:"#fff" }}>{s.val}</div>
                  <div style={{ fontSize:11.5,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes */}
          {(overdue.length>0||gaps.length>0)&&(
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
              {overdue.map((d:any)=>(
                <div key={d.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:"#F5E4E4",border:"1px solid #E0C0C0",flexWrap:"wrap" }}>
                  <span style={{ fontSize:18 }}>⚠️</span>
                  <span style={{ flex:1,fontSize:14 }}><strong>{d.med_name}</strong> prévu à {d.scheduled_time?.slice(0,5)} — non donné.</span>
                  <a href="/dashboard/sante" style={{ padding:"7px 14px",borderRadius:999,background:"#A84848",color:"#fff",fontSize:13,fontWeight:600 }}>Vérifier →</a>
                </div>
              ))}
              {gaps.map((v:any)=>(
                <div key={v.visit_date} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:"#F5EADB",border:"1px solid #EAD8B0",flexWrap:"wrap" }}>
                  <span style={{ fontSize:18 }}>📅</span>
                  <span style={{ flex:1,fontSize:14 }}>
                    <strong>{v.day_offset===0?"Aujourd'hui":new Date(v.visit_date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long"})}</strong> — personne de prévu.
                  </span>
                  <a href="/dashboard/relais" style={{ padding:"7px 14px",borderRadius:999,background:"#B07830",color:"#fff",fontSize:13,fontWeight:600 }}>Je m'en occupe →</a>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16 }}>
            {/* Médicaments */}
            <div style={{ background:"#fff",border:"1px solid #DDD9CF",borderRadius:18,padding:"20px 22px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:14 }}>
                <h3 style={{ fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:600 }}>Médicaments du jour</h3>
                <a href="/dashboard/sante" style={{ color:"#3A6B5E",fontSize:13,fontWeight:600 }}>Tout voir →</a>
              </div>
              {doses.length===0
                ? <p style={{ color:"#9AA69F",fontSize:14 }}>Aucun médicament configuré.</p>
                : doses.map((d:any)=>(
                  <div key={d.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:12,marginBottom:7,
                    background:d.given?"#E4EFEB":d.is_overdue?"#F5E4E4":"#F7F6F0",
                    border:`1px solid ${d.given?"#C8DDD1":d.is_overdue?"#E0C0C0":"#E6E2D8"}` }}>
                    <div style={{ width:22,height:22,borderRadius:7,flexShrink:0,background:d.given?"#3A6B5E":"transparent",
                      border:`2px solid ${d.given?"#3A6B5E":d.is_overdue?"#A84848":"#BDB9AF"}`,
                      display:"grid",placeItems:"center",color:"#fff",fontSize:12,fontWeight:700 }}>
                      {d.given?"✓":""}
                    </div>
                    <span style={{ flex:1,fontWeight:600,fontSize:14,
                      textDecoration:d.given?"line-through":"none",color:d.given?"#9AA69F":"#1A2622" }}>
                      {d.med_name} <span style={{ color:"#66756F",fontWeight:400 }}>{d.med_dose}</span>
                    </span>
                    <span style={{ fontSize:13,color:"#66756F" }}>{d.scheduled_time?.slice(0,5)}</span>
                  </div>
                ))
              }
            </div>

            {/* Cercle */}
            <div style={{ background:"#fff",border:"1px solid #DDD9CF",borderRadius:18,padding:"20px 22px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:14 }}>
                <h3 style={{ fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:600 }}>Le cercle</h3>
                <a href="/dashboard/reglages" style={{ color:"#3A6B5E",fontSize:13,fontWeight:600 }}>Gérer →</a>
              </div>
              <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                {members.map((m:any,i:number)=>{
                  const name=m.profiles?.full_name??"Membre";
                  const init=name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
                  return (
                    <div key={m.user_id} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                      <div style={{ width:42,height:42,borderRadius:999,background:COLORS[i%COLORS.length],
                        color:"#fff",display:"grid",placeItems:"center",fontWeight:700,fontSize:15 }}>{init}</div>
                      <span style={{ fontSize:11.5,color:"#66756F" }}>{name.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
