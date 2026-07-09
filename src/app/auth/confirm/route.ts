import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de confirmation email Supabase.
 * Le lien envoyé par Supabase (confirmation d'inscription, magic link…) atterrit
 * ici avec, selon le flux, un `code` (PKCE) ou un `token_hash` + `type`.
 * On établit la session (pose les cookies) puis on redirige vers l'app.
 * `next` permet de revenir sur une page précise (ex: acceptation d'invitation).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // On n'autorise que des chemins internes pour éviter les redirections ouvertes.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, origin));
  return NextResponse.redirect(new URL("/login?error=lien_invalide", origin));
}
