import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardSubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div style={{ padding:32,fontFamily:"'Inter',sans-serif",color:"#1A2622" }}>
      <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:24,marginBottom:8 }}>
        journal
      </h1>
      <p style={{ color:"#66756F" }}>Page connectée — coller le composant ici.</p>
    </div>
  );
}
