// Types partagés par les Server Actions.
// Fichier neutre (pas de "use server") : un module "use server" ne doit
// exporter que des fonctions async.

export type ActionResult = { ok: true } | { ok: false; error: string };

export type InviteResult =
  | { ok: true; token: string; emailSent: boolean; emailError?: string }
  | { ok: false; error: string };
