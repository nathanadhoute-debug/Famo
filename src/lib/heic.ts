const HEIC_PATTERN = /\.hei[cf]$/i;

/**
 * Convertit une photo HEIC (format par défaut des photos iPhone, non
 * décodable par la plupart des navigateurs hors Safari) en JPEG directement
 * dans le navigateur, avant l'envoi au serveur. Ne fait rien si le fichier
 * n'est pas au format HEIC. Import dynamique de la bibliothèque de
 * conversion (assez lourde, WASM) : chargée uniquement si un HEIC est
 * réellement sélectionné, jamais pour les autres formats.
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" || HEIC_PATTERN.test(file.name);
  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(result) ? result[0] : result;
  return new File([blob], file.name.replace(HEIC_PATTERN, ".jpg"), { type: "image/jpeg" });
}
