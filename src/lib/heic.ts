const HEIC_PATTERN = /\.hei[cf]$/i;

export type HeicConversionResult = { file: File; warning: string | null };

/**
 * Tente un décodage HEIC natif via <img>/<canvas> — ne fonctionne que dans
 * Safari (iPhone/Mac), seul navigateur avec un décodeur HEIC natif intégré
 * (celui d'Apple, qui gère aussi le mode Portrait). Ne lève jamais : renvoie
 * `null` si le navigateur ne peut pas décoder (Chrome/Firefox) ou en cas de
 * problème quelconque, pour laisser la suite (heic2any) prendre le relais.
 */
async function tryNativeHeicDecode(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return null;
    return new File([blob], file.name.replace(HEIC_PATTERN, ".jpg"), { type: "image/jpeg" });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Convertit une photo HEIC (format par défaut des photos iPhone, non
 * décodable par la plupart des navigateurs hors Safari) en JPEG directement
 * dans le navigateur, avant l'envoi au serveur. Ne fait rien si le fichier
 * n'est pas au format HEIC.
 *
 * Deux méthodes essayées dans l'ordre :
 * 1. Décodage natif via <img>/<canvas> (fonctionne uniquement dans Safari,
 *    mais gère alors absolument toutes les variantes de HEIC, y compris le
 *    mode Portrait, puisque c'est le vrai décodeur d'Apple).
 * 2. `heic2any` (bibliothèque JS/WASM, chargée dynamiquement — assez lourde,
 *    donc jamais importée si la méthode native a déjà réussi) : fonctionne
 *    dans les autres navigateurs, mais pas pour toutes les variantes de HEIC.
 *
 * Si les deux échouent (ex. mode Portrait dans un navigateur autre que
 * Safari), le fichier original est renvoyé tel quel avec un avertissement
 * non bloquant plutôt que d'empêcher l'ajout.
 */
export async function convertHeicIfNeeded(file: File): Promise<HeicConversionResult> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" || HEIC_PATTERN.test(file.name);
  if (!isHeic) return { file, warning: null };

  const native = await tryNativeHeicDecode(file);
  if (native) return { file: native, warning: null };

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
