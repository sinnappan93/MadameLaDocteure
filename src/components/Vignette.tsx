import { db } from '../lib/db';
import { useLive, useUrlFichier } from '../lib/useLive';

/** Affiche une image enregistrée sur l'appareil, ou l'image en ligne d'un musée, à partir de son identifiant. */
export function Vignette({ imageId, alt, className }: { imageId?: string; alt: string; className?: string }) {
  const donnees = useLive(async () => {
    if (!imageId) return undefined;
    const image = await db.images.get(imageId);
    if (!image) return undefined;
    return { distante: image.urlDistante, fichier: image.fichierId ? await db.fichiers.get(image.fichierId) : undefined };
  }, [imageId]);
  const locale = useUrlFichier(donnees?.fichier?.blob);
  const url = locale ?? donnees?.distante;
  if (!url) return <div className={`vignette vide ${className ?? ''}`} aria-label={alt} />;
  return <img className={`vignette ${className ?? ''}`} src={url} alt={alt} loading="lazy" referrerPolicy="no-referrer" />;
}
