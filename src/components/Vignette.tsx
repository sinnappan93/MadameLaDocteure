import { db } from '../lib/db';
import { useLive, useUrlFichier } from '../lib/useLive';

/** Affiche une image stockée sur l'appareil à partir de son identifiant. */
export function Vignette({ imageId, alt, className }: { imageId?: string; alt: string; className?: string }) {
  const fichier = useLive(async () => {
    if (!imageId) return undefined;
    const image = await db.images.get(imageId);
    return image ? db.fichiers.get(image.fichierId) : undefined;
  }, [imageId]);
  const url = useUrlFichier(fichier?.blob);
  if (!url) return <div className={`vignette vide ${className ?? ''}`} aria-label={alt} />;
  return <img className={`vignette ${className ?? ''}`} src={url} alt={alt} loading="lazy" />;
}
