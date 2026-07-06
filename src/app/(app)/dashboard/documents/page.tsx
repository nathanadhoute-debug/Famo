'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadDocuments() {
      const { data } = await supabase.storage.from("documents").list();
      setDocuments(data || []);
    }
    loadDocuments();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 24 }}>Documents</h1>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, marginBottom: 16 }}>Coffre-fort</h2>
        {documents.length === 0 ? (
          <p style={{ color: "#66756F" }}>Aucun document</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {documents.map((doc: any) => (
              <div key={doc.name} style={{ padding: 12, background: "#F4F2EC", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>📄 {doc.name}</p>
                  <p style={{ color: "#999", fontSize: 12 }}>{new Date(doc.updated_at).toLocaleDateString('fr')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}