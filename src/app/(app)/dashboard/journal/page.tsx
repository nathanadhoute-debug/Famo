'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadEntries() {
      const { data } = await supabase.from("journal_entries").select("*").limit(10).order("created_at", { ascending: false });
      setEntries(data || []);
    }
    loadEntries();
  }, []);

  const addEntry = async () => {
    if (!newEntry.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("journal_entries").insert({ content: newEntry, author_id: user.id } as any).select().single();
    if (data) setEntries([data, ...entries]);
    setNewEntry("");
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 24 }}>Journal</h1>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 24 }}>
        <textarea 
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Ajouter une note..."
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #DDD9CF", fontFamily: "inherit", minHeight: 100, resize: "vertical" }}
        />
        <button onClick={addEntry} style={{ marginTop: 12, padding: "10px 16px", background: "#3A6B5E", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          Enregistrer
        </button>
      </div>
      <div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, marginBottom: 16 }}>Dernières entrées</h2>
        {entries.length === 0 ? (
          <p style={{ color: "#66756F" }}>Aucune entrée</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {entries.map((e: any) => (
              <div key={e.id} style={{ padding: 12, background: "#F4F2EC", borderRadius: 8 }}>
                <p style={{ marginBottom: 8 }}>{e.content}</p>
                <p style={{ color: "#999", fontSize: 12 }}>{new Date(e.created_at).toLocaleDateString('fr')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}