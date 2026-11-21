/**
 * Stockage local (IndexedDB via Dexie) : tout reste sur l'appareil, y compris les images,
 * pour réviser hors ligne. Les fichiers sont dans une table à part pour garder les listes légères.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { ImageOeuvre, ImageSource, NouvelleOeuvre, Oeuvre } from '../domain/types';

export interface Fichier {
  id: string;
  blob: Blob;
}

export class Base extends Dexie {
  oeuvres!: EntityTable<Oeuvre, 'id'>;
  images!: EntityTable<ImageOeuvre, 'id'>;
  fichiers!: EntityTable<Fichier, 'id'>;

  constructor(nom = 'madameladocteure') {
    super(nom);
    this.version(1).stores({
      oeuvres: 'id, titre, periodeId, aireId, debut, modifieeLe, *etiquettes',
      images: 'id, oeuvreId',
      fichiers: 'id',
    });
  }
}

export const db = new Base();

const nouvelId = () => crypto.randomUUID();
const maintenant = () => new Date().toISOString();

export async function creerOeuvre(donnees: NouvelleOeuvre, base: Base = db): Promise<Oeuvre> {
  const oeuvre: Oeuvre = { ...donnees, id: nouvelId(), creeeLe: maintenant(), modifieeLe: maintenant() };
  await base.oeuvres.add(oeuvre);
  return oeuvre;
}

export async function modifierOeuvre(id: string, changements: Partial<NouvelleOeuvre>, base: Base = db): Promise<void> {
  await base.oeuvres.update(id, { ...changements, modifieeLe: maintenant() });
}

/** Supprime l'œuvre, ses images et leurs fichiers. */
export async function supprimerOeuvre(id: string, base: Base = db): Promise<void> {
  await base.transaction('rw', base.oeuvres, base.images, base.fichiers, async () => {
    const images = await base.images.where('oeuvreId').equals(id).toArray();
    await base.fichiers.bulkDelete(images.map((i) => i.fichierId));
    await base.images.bulkDelete(images.map((i) => i.id));
    await base.oeuvres.delete(id);
  });
}

export interface MetaImage {
  source: ImageSource;
  largeur?: number;
  hauteur?: number;
  titre?: string;
  auteur?: string;
  licence?: string;
  urlOrigine?: string;
}

/** Enregistre une image pour une œuvre ; la première devient l'image principale. */
export async function ajouterImage(oeuvreId: string, blob: Blob, meta: MetaImage, base: Base = db): Promise<ImageOeuvre> {
  const image: ImageOeuvre = { ...meta, id: nouvelId(), oeuvreId, fichierId: nouvelId(), ajouteeLe: maintenant() };
  await base.transaction('rw', base.oeuvres, base.images, base.fichiers, async () => {
    await base.fichiers.add({ id: image.fichierId, blob });
    await base.images.add(image);
    const oeuvre = await base.oeuvres.get(oeuvreId);
    if (oeuvre && !oeuvre.imagePrincipaleId) await base.oeuvres.update(oeuvreId, { imagePrincipaleId: image.id });
  });
  return image;
}

export async function supprimerImage(imageId: string, base: Base = db): Promise<void> {
  await base.transaction('rw', base.oeuvres, base.images, base.fichiers, async () => {
    const image = await base.images.get(imageId);
    if (!image) return;
    await base.fichiers.delete(image.fichierId);
    await base.images.delete(imageId);
    const oeuvre = await base.oeuvres.get(image.oeuvreId);
    if (oeuvre?.imagePrincipaleId === imageId) {
      const suivante = await base.images.where('oeuvreId').equals(image.oeuvreId).first();
      await base.oeuvres.update(image.oeuvreId, { imagePrincipaleId: suivante?.id });
    }
  });
}

export async function imagesDe(oeuvreId: string, base: Base = db): Promise<ImageOeuvre[]> {
  const images = await base.images.where('oeuvreId').equals(oeuvreId).toArray();
  return images.sort((a, b) => a.ajouteeLe.localeCompare(b.ajouteeLe));
}
