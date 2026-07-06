'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SantePage() {
  const [vitals, setVitals] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadVitals() {
      const { data } = await supabase.from("vitals").select("*").limit(5).order("created_at", { ascending: false });
      setVitals(data || []);
    }
    loadVitals();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 24 }}>Santé</h1>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, marginBottom: 16 }}>Derniers indicateurs</h2>
        {vitals.length === 0 ? (
          <p style={{ color: "#66756F" }}>Aucune donnée enregistrée</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {vitals.map((v: any) => (
              <div key={v.id} style={{ padding: 12, background: "#F4F2EC", borderRadius: 8 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{v.type}</p>
                <p style={{ color: "#66756F" }}>{v.value} {v.unit} — {new Date(v.created_at).toLocaleDateString('fr')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
