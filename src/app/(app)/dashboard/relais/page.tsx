'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RelaisPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadVisits() {
      const { data } = await supabase.from("visits").select("*").limit(8).order("scheduled_date", { ascending: true });
      setVisits(data || []);
    }
    loadVisits();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 24 }}>Relais</h1>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, marginBottom: 16 }}>Calendrier des visites</h2>
        {visits.length === 0 ? (
          <p style={{ color: "#66756F" }}>Aucune visite programmée</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visits.map((v: any) => (
              <div key={v.id} style={{ padding: 12, background: "#F4F2EC", borderRadius: 8, borderLeft: "4px solid #3A6B5E" }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{v.visitor_name}</p>
                <p style={{ color: "#66756F", fontSize: 14 }}>📅 {new Date(v.scheduled_date).toLocaleDateString('fr')} à {v.time || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}