const HEIC_PATTERN = /\.hei[cf]$/i;

export type HeicConversionResult = { file: File; warning: string | null };

/**
 * Convertit une photo HEIC (format par défaut des photos iPhone, non
 * décodable par la plupart des navigateurs hors Safari) en JPEG directement
 * dans le navigateur, avant l'envoi au serveur. Ne fait rien si le fichier
 * n'est pas au format HEIC. Import dynamique de la bibliothèque de
 * conversion (assez lourde, WASM) : chargée uniquement si un HEIC est
 * réellement sélectionné, jamais pour les autres formats.
 *
 * Certaines variantes de HEIC (typiquement le mode Portrait, qui embarque
 * une carte de profondeur) ne sont pas décodables par cette bibliothèque —
 * plutôt que de bloquer l'ajout, on renvoie alors le fichier original tel
 * quel : Safari (iPhone/Mac) l'affichera nativement, les autres navigateurs
 * afficheront une image cassée pour cette photo précise. Un avertissement
 * est renvoyé pour informer l'utilisateur sans empêcher l'envoi.
 */
export async function convertHeicIfNeeded(file: File): Promise<HeicConversionResult> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" || HEIC_PATTERN.test(file.name);
  if (!isHeic) return { file, warning: null };

  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(result) ? result[0] : result;
    return { file: new File([blob], file.name.replace(HEIC_PATTERN, ".jpg"), { type: "image/jpeg" }), warning: null };
  } catch {
    return {
      file,
      warning: "Cette photo n'a pas pu être convertie (souvent le cas des photos en mode Portrait) et pourrait ne pas s'afficher sur tous les appareils, sauf Safari. Pour un rendu garanti partout, exportez-la en JPEG avant de l'ajouter.",
    };
  }
}
