/** Préparation des images avant enregistrement : téléchargement depuis le net et réduction de taille. */

const COTE_MAX = 1600;

export interface ImagePreparee {
  blob: Blob;
  largeur: number;
  hauteur: number;
}

/** Réduit l'image (côté max 1600 px, JPEG) : une photo de téléphone passe de ~5 Mo à ~300 Ko. */
export async function reduireImage(source: Blob, coteMax = COTE_MAX): Promise<ImagePreparee> {
  const bitmap = await createImageBitmap(source);
  const echelle = Math.min(1, coteMax / Math.max(bitmap.width, bitmap.height));
  const largeur = Math.round(bitmap.width * echelle);
  const hauteur = Math.round(bitmap.height * echelle);
  if (echelle === 1 && source.type === 'image/jpeg') {
    bitmap.close();
    return { blob: source, largeur, hauteur };
  }
  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();
  const blob = await new Promise<Blob>((ok, ko) =>
    canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Conversion de l’image impossible'))), 'image/jpeg', 0.85),
  );
  return { blob, largeur, hauteur };
}

/** Télécharge une image depuis une adresse web, puis la réduit. */
export async function telechargerImage(url: string): Promise<ImagePreparee> {
  let reponse: Response;
  try {
    reponse = await fetch(url);
  } catch {
    throw new Error(
      'Téléchargement impossible : le site bloque peut-être les accès depuis une application. ' +
        'Enregistrez l’image sur le téléphone puis ajoutez-la comme photo.',
    );
  }
  if (!reponse.ok) throw new Error(`Le site a répondu ${reponse.status}`);
  const blob = await reponse.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Cette adresse ne pointe pas vers une image.');
  return reduireImage(blob);
}
