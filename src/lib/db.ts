/**
 * Stockage local (IndexedDB via Dexie) : tout reste sur l'appareil, y compris les images,
 * pour réviser hors ligne. Les fichiers sont dans une table à part pour garder les listes légères.
 */
import Dexie, { type EntityTable } from 'dexie';
import { type FicheReference, REFERENCES } from '../data/references';
import type { NoticeMusee } from '../domain/musees';
import type { Copie, Sujet } from '../domain/examen';
import type { DossierOral, Oral } from '../domain/oral';
import type { DemandePlan, Seance } from '../domain/plan';
import type { Lecture, NouvelleLecture, Visite } from '../domain/preparation';
import { type Carte, type EtatCarte, type Note, noter } from '../domain/revision';
import { type ImageOeuvre, type ImageSource, type NouvelleOeuvre, type Oeuvre, oeuvreVide } from '../domain/types';

export interface Meta {
  cle: string;
  valeur: unknown;
}

export interface Fichier {
  id: string;
  blob: Blob;
}

export class Base extends Dexie {
  oeuvres!: EntityTable<Oeuvre, 'id'>;
  images!: EntityTable<ImageOeuvre, 'id'>;
  fichiers!: EntityTable<Fichier, 'id'>;
  meta!: EntityTable<Meta, 'cle'>;
  revisions!: EntityTable<EtatCarte, 'id'>;
  sujets!: EntityTable<Sujet, 'id'>;
  copies!: EntityTable<Copie, 'id'>;
  oraux!: EntityTable<Oral, 'id'>;
  seances!: EntityTable<Seance, 'id'>;
  lectures!: EntityTable<Lecture, 'id'>;
  visites!: EntityTable<Visite, 'id'>;

  constructor(nom = 'madameladocteure') {
    super(nom);
    this.version(1).stores({
      oeuvres: 'id, titre, periodeId, aireId, debut, modifieeLe, *etiquettes',
      images: 'id, oeuvreId',
      fichiers: 'id',
    });
    this.version(2).stores({ meta: 'cle' });
    this.version(3).stores({ revisions: 'id, oeuvreId, echeance' });
    this.version(4).stores({ sujets: 'id, type', copies: 'id, type, debut' });
    this.version(5).stores({ oraux: 'id, debut' });
    this.version(6).stores({ seances: 'id, date', lectures: 'id, statut', visites: 'id, date' });
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
  await base.transaction('rw', [base.oeuvres, base.images, base.fichiers, base.revisions], async () => {
    await base.revisions.where('oeuvreId').equals(id).delete();
    const images = await base.images.where('oeuvreId').equals(id).toArray();
    await base.fichiers.bulkDelete(images.flatMap((i) => (i.fichierId ? [i.fichierId] : [])));
    await base.images.bulkDelete(images.map((i) => i.id));
    await base.oeuvres.delete(id);
  });
}

export interface MetaImage {
  source: ImageSource;
  /** Pour une image en ligne non téléchargeable : son adresse (aucun fichier n'est alors stocké). */
  urlDistante?: string;
  largeur?: number;
  hauteur?: number;
  titre?: string;
  auteur?: string;
  licence?: string;
  urlOrigine?: string;
}

/** Enregistre une image pour une œuvre (fichier, ou adresse en ligne si `blob` est absent) ; la première devient l'image principale. */
export async function ajouterImage(oeuvreId: string, blob: Blob | undefined, meta: MetaImage, base: Base = db): Promise<ImageOeuvre> {
  const image: ImageOeuvre = { ...meta, id: nouvelId(), oeuvreId, fichierId: blob ? nouvelId() : undefined, ajouteeLe: maintenant() };
  await base.transaction('rw', base.oeuvres, base.images, base.fichiers, async () => {
    if (blob && image.fichierId) await base.fichiers.add({ id: image.fichierId, blob });
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
    if (image.fichierId) await base.fichiers.delete(image.fichierId);
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

const CLE_REFERENCES = 'references-installees';

function ficheDeReference(ref: FicheReference, date: string): Oeuvre {
  const { imageCommons: _image, ...contenu } = ref;
  return { ...oeuvreVide(), ...contenu, reference: true, creeeLe: date, modifieeLe: date };
}

/**
 * Applique les corrections des fiches préparées (nouvelle version de l'application) aux fiches
 * que l'utilisatrice n'a jamais modifiées. Les images, notices et dates de création sont conservées.
 */
export async function mettreAJourReferences(base: Base = db): Promise<number> {
  return base.transaction('rw', base.oeuvres, async () => {
    const presentes = await base.oeuvres.bulkGet(REFERENCES.map((r) => r.id));
    let n = 0;
    for (const [i, ref] of REFERENCES.entries()) {
      const o = presentes[i];
      if (!o || o.personnalisee) continue;
      const neuve = ficheDeReference(ref, o.creeeLe);
      const suivante: Oeuvre = { ...neuve, imagePrincipaleId: o.imagePrincipaleId, notices: o.notices, modifieeLe: o.modifieeLe };
      if (JSON.stringify(suivante) !== JSON.stringify(o)) {
        await base.oeuvres.put(suivante);
        n++;
      }
    }
    return n;
  });
}

/** Ajoute une notice de musée à une fiche (sans doublon). */
export async function ajouterNotice(oeuvreId: string, notice: NoticeMusee, base: Base = db): Promise<void> {
  await base.transaction('rw', base.oeuvres, async () => {
    const o = await base.oeuvres.get(oeuvreId);
    if (!o) return;
    const autres = (o.notices ?? []).filter((n) => !(n.source === notice.source && n.idMusee === notice.idMusee));
    await base.oeuvres.update(oeuvreId, { notices: [...autres, { ...notice, recupereeLe: maintenant() }] });
  });
}

export async function retirerNotice(oeuvreId: string, notice: Pick<NoticeMusee, 'source' | 'idMusee'>, base: Base = db): Promise<void> {
  await base.transaction('rw', base.oeuvres, async () => {
    const o = await base.oeuvres.get(oeuvreId);
    if (!o) return;
    await base.oeuvres.update(oeuvreId, { notices: (o.notices ?? []).filter((n) => !(n.source === notice.source && n.idMusee === notice.idMusee)) });
  });
}

/**
 * Installe les fiches de référence qui ne l'ont jamais été. Une fiche supprimée ou modifiée
 * n'est jamais réinstallée ni écrasée : on retient les identifiants déjà installés.
 * Retourne le nombre de fiches ajoutées.
 */
export async function installerReferences(base: Base = db): Promise<number> {
  return base.transaction('rw', base.oeuvres, base.meta, async () => {
    const deja = new Set(((await base.meta.get(CLE_REFERENCES))?.valeur as string[] | undefined) ?? []);
    const nouvelles = REFERENCES.filter((r) => !deja.has(r.id));
    if (nouvelles.length === 0) return 0;
    // Dates décroissantes : l'ordre « dernières fiches » de l'accueil suit l'ordre du catalogue.
    const t = Date.now();
    const fiches = nouvelles.map((r, i) => ficheDeReference(r, new Date(t - i * 1000).toISOString()));
    const existantes = new Set((await base.oeuvres.bulkGet(fiches.map((f) => f.id))).filter(Boolean).map((o) => o!.id));
    await base.oeuvres.bulkAdd(fiches.filter((f) => !existantes.has(f.id)));
    await base.meta.put({ cle: CLE_REFERENCES, valeur: [...deja, ...nouvelles.map((r) => r.id)] });
    return fiches.length - existantes.size;
  });
}

/** Réinstalle les fiches de référence supprimées (sans toucher à celles qui existent encore). */
export async function restaurerReferences(base: Base = db): Promise<number> {
  return base.transaction('rw', base.oeuvres, async () => {
    const presentes = await base.oeuvres.bulkGet(REFERENCES.map((r) => r.id));
    const manquantes = REFERENCES.filter((_, i) => !presentes[i]);
    const date = new Date().toISOString();
    await base.oeuvres.bulkAdd(manquantes.map((r) => ficheDeReference(r, date)));
    return manquantes.length;
  });
}

/** Enregistre la réponse à une carte de révision et renvoie son nouvel état. */
export async function enregistrerReponse(carte: Carte, note: Note, maintenant = new Date(), base: Base = db): Promise<EtatCarte> {
  const precedent = await base.revisions.get(carte.id);
  const etat = noter(precedent, carte, note, maintenant);
  await base.revisions.put(etat);
  return etat;
}

// ——— Mode examen ———

export async function ajouterSujet(s: Omit<Sujet, 'id' | 'creeLe'>, base: Base = db): Promise<Sujet> {
  const sujet: Sujet = { ...s, id: nouvelId(), creeLe: maintenant() };
  await base.sujets.add(sujet);
  return sujet;
}

export async function creerCopie(c: Omit<Copie, 'id' | 'modifieeLe' | 'photos' | 'texte'> & Partial<Pick<Copie, 'texte' | 'photos'>>, base: Base = db): Promise<Copie> {
  const copie: Copie = { texte: '', photos: [], ...c, id: nouvelId(), modifieeLe: maintenant() };
  await base.copies.add(copie);
  return copie;
}

export async function modifierCopie(id: string, changements: Partial<Copie>, base: Base = db): Promise<void> {
  await base.copies.update(id, { ...changements, modifieeLe: maintenant() });
}

/** Ajoute la photo d'une page de copie manuscrite. */
export async function ajouterPhotoCopie(id: string, blob: Blob, base: Base = db): Promise<void> {
  await base.transaction('rw', base.copies, base.fichiers, async () => {
    const copie = await base.copies.get(id);
    if (!copie) return;
    const fichierId = nouvelId();
    await base.fichiers.add({ id: fichierId, blob });
    await base.copies.update(id, { photos: [...copie.photos, fichierId], modifieeLe: maintenant() });
  });
}

export async function retirerPhotoCopie(id: string, fichierId: string, base: Base = db): Promise<void> {
  await base.transaction('rw', base.copies, base.fichiers, async () => {
    const copie = await base.copies.get(id);
    if (!copie) return;
    await base.fichiers.delete(fichierId);
    await base.copies.update(id, { photos: copie.photos.filter((p) => p !== fichierId), modifieeLe: maintenant() });
  });
}

export async function supprimerCopie(id: string, base: Base = db): Promise<void> {
  await base.transaction('rw', base.copies, base.fichiers, async () => {
    const copie = await base.copies.get(id);
    if (copie) await base.fichiers.bulkDelete(copie.photos);
    await base.copies.delete(id);
  });
}

// ——— Simulateur d'oral ———

export async function creerOral(
  o: { dossier: DossierOral; dureePrepMin: number; dureeEpreuveMin: number; dureeExposeMin: number },
  base: Base = db,
): Promise<Oral> {
  const oral: Oral = { ...o, id: nouvelId(), phase: 'preparation', debut: maintenant(), notes: '', exposeTexte: '', questions: [], modifieLe: maintenant() };
  await base.oraux.add(oral);
  return oral;
}

export async function modifierOral(id: string, changements: Partial<Oral>, base: Base = db): Promise<void> {
  await base.oraux.update(id, { ...changements, modifieLe: maintenant() });
}

/** Enregistre (ou remplace) un fichier audio ; renvoie son identifiant. */
export async function enregistrerAudio(blob: Blob, fichierId: string = nouvelId(), base: Base = db): Promise<string> {
  await base.fichiers.put({ id: fichierId, blob });
  return fichierId;
}

/** Fichiers audio d'un oral (exposé et réponses). */
export const audiosDe = (o: Oral) => [o.exposeAudio, ...o.questions.map((q) => q.audio)].filter((x): x is string => !!x);

export async function supprimerOral(id: string, base: Base = db): Promise<void> {
  await base.transaction('rw', base.oraux, base.fichiers, async () => {
    const oral = await base.oraux.get(id);
    if (oral) await base.fichiers.bulkDelete(audiosDe(oral));
    await base.oraux.delete(id);
  });
}

// ——— Plan de révision ———

const CLE_PLAN = 'plan-demande';

export async function lireDemandePlan(base: Base = db): Promise<DemandePlan | undefined> {
  return (await base.meta.get(CLE_PLAN))?.valeur as DemandePlan | undefined;
}

/** Remplace tout le plan (séances et paramètres). */
export async function enregistrerPlan(demande: DemandePlan, seances: Seance[], base: Base = db): Promise<void> {
  await base.transaction('rw', base.seances, base.meta, async () => {
    await base.seances.clear();
    await base.seances.bulkAdd(seances);
    await base.meta.put({ cle: CLE_PLAN, valeur: demande });
  });
}

export async function supprimerPlan(base: Base = db): Promise<void> {
  await base.transaction('rw', base.seances, base.meta, async () => {
    await base.seances.clear();
    await base.meta.delete(CLE_PLAN);
  });
}

export async function marquerSeance(id: string, faite: boolean, base: Base = db): Promise<void> {
  await base.seances.update(id, { faite, faiteLe: faite ? maintenant() : undefined });
}

// ——— Bibliographie ———

export async function creerLecture(n: NouvelleLecture, base: Base = db): Promise<Lecture> {
  const lecture: Lecture = { pageActuelle: 0, statut: 'a-lire', notes: '', oeuvreIds: [], ...n, historique: [], id: nouvelId(), creeeLe: maintenant(), modifieeLe: maintenant() };
  await base.lectures.add(lecture);
  return lecture;
}

export async function modifierLecture(id: string, changements: Partial<Lecture>, base: Base = db): Promise<void> {
  await base.lectures.update(id, { ...changements, modifieeLe: maintenant() });
}

export async function supprimerLecture(id: string, base: Base = db): Promise<void> {
  await base.lectures.delete(id);
}

// ——— Visites ———

export async function creerVisite(v: Omit<Visite, 'id' | 'creeeLe' | 'oeuvreIds' | 'notes'> & Partial<Pick<Visite, 'notes'>>, base: Base = db): Promise<Visite> {
  const visite: Visite = { notes: '', ...v, oeuvreIds: [], id: nouvelId(), creeeLe: maintenant() };
  await base.visites.add(visite);
  return visite;
}

export async function modifierVisite(id: string, changements: Partial<Visite>, base: Base = db): Promise<void> {
  await base.visites.update(id, changements);
}

/** Supprime l'entrée du journal ; les fiches créées pendant la visite sont gardées. */
export async function supprimerVisite(id: string, base: Base = db): Promise<void> {
  await base.visites.delete(id);
}

/** Transforme une photo prise pendant une visite en fiche d'œuvre (photo de l'œuvre, et du cartel si fournie). */
export async function ficheDepuisPhoto(
  visiteId: string,
  donnees: NouvelleOeuvre,
  photo: Blob,
  cartel?: Blob,
  base: Base = db,
): Promise<Oeuvre> {
  const oeuvre = await creerOeuvre(donnees, base);
  await ajouterImage(oeuvre.id, photo, { source: 'photo', titre: 'Photo prise pendant la visite' }, base);
  if (cartel) await ajouterImage(oeuvre.id, cartel, { source: 'photo', titre: 'Cartel' }, base);
  const visite = await base.visites.get(visiteId);
  if (visite) await base.visites.update(visiteId, { oeuvreIds: [...visite.oeuvreIds, oeuvre.id] });
  return oeuvre;
}
