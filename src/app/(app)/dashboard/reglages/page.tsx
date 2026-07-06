'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReglagesPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 24 }}>Paramètres</h1>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, marginBottom: 16 }}>Profil</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <p style={{ color: "#999", fontSize: 12 }}>Email</p>
            <p style={{ fontWeight: 600 }}>{user?.email}</p>
          </div>
          {profile && (
            <div>
              <p style={{ color: "#999", fontSize: 12 }}>Nom complet</p>
              <p style={{ fontWeight: 600 }}>{profile.full_name || "—"}</p>
            </div>
          )}
        </div>
      </div>
      <button onClick={handleLogout} style={{ padding: "12px 20px", background: "#D97060", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
        Se déconnecter
      </button>
    </div>
  );
}