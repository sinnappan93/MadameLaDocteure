/**
 * Révision « identifie cette œuvre » : cartes tirées des fiches illustrées, planifiées par
 * répétition espacée (variante simplifiée de l'algorithme SM-2 d'Anki).
 * Logique pure, sans stockage : le temps et le hasard sont passés en paramètres pour les tests.
 */
import { PERIODES, periodeParId } from './catalogue';
import type { Oeuvre } from './types';

/**
 * Œuvres : « identifier » (photo puis auto-évaluation) et « periode » (QCM).
 * Glossaire : « terme » (terme puis définition, auto-évaluation) et « definition » (définition, QCM du terme).
 */
export type TypeCarte = 'identifier' | 'periode' | 'site' | 'musee' | 'iconographie' | 'terme' | 'definition' | 'comparaison';

/** Variantes proposées après la première identification d'une œuvre. */
export const VARIANTES_OEUVRE: TypeCarte[] = ['periode', 'site', 'musee', 'iconographie'];

/** 0 : à revoir, 1 : difficile, 2 : bien, 3 : facile. */
export type Note = 0 | 1 | 2 | 3;

export interface EtatCarte {
  /** `${oeuvreId}:${type}` */
  id: string;
  /** Identifiant du sujet de la carte : fiche d'œuvre, ou terme du glossaire (« gl-… »). */
  oeuvreId: string;
  type: TypeCarte;
  /** Réussites consécutives. */
  repetitions: number;
  /** Intervalle actuel, en jours (0 = à revoir dans la journée). */
  intervalle: number;
  /** Facilité (multiplicateur d'intervalle), entre 1,3 et 3. */
  facilite: number;
  /** Prochaine révision (ISO). */
  echeance: string;
  derniereRevision: string;
  revisions: number;
  erreurs: number;
}

export interface Carte {
  id: string;
  oeuvreId: string;
  type: TypeCarte;
  etat?: EtatCarte;
}

const JOUR = 86_400_000;
const MINUTES_A_REVOIR = 10;
export const SEUIL_MAITRISE = 21;
export const QCM_PAR_SEANCE = 5;

export const idCarte = (oeuvreId: string, type: TypeCarte) => `${oeuvreId}:${type}`;

/** Nouvel état après une réponse. */
export function noter(etat: EtatCarte | undefined, carte: Pick<Carte, 'oeuvreId' | 'type'>, note: Note, maintenant: Date): EtatCarte {
  const e: EtatCarte = etat ?? {
    id: idCarte(carte.oeuvreId, carte.type),
    oeuvreId: carte.oeuvreId,
    type: carte.type,
    repetitions: 0,
    intervalle: 0,
    facilite: 2.5,
    echeance: maintenant.toISOString(),
    derniereRevision: maintenant.toISOString(),
    revisions: 0,
    erreurs: 0,
  };
  let { repetitions, intervalle, facilite } = e;
  if (note === 0) {
    repetitions = 0;
    intervalle = 0;
    facilite = Math.max(1.3, facilite - 0.2);
  } else {
    if (note === 1) {
      intervalle = repetitions === 0 ? 1 : Math.max(intervalle + 1, Math.round(intervalle * 1.2));
      facilite = Math.max(1.3, facilite - 0.15);
    } else if (note === 2) {
      intervalle = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(intervalle + 1, Math.round(intervalle * facilite));
    } else {
      intervalle = repetitions === 0 ? 3 : Math.max(intervalle + 2, Math.round(intervalle * facilite * 1.3));
      facilite = Math.min(3, facilite + 0.15);
    }
    repetitions += 1;
  }
  const delai = intervalle === 0 ? MINUTES_A_REVOIR * 60_000 : intervalle * JOUR;
  return {
    ...e,
    repetitions,
    intervalle,
    facilite,
    echeance: new Date(maintenant.getTime() + delai).toISOString(),
    derniereRevision: maintenant.toISOString(),
    revisions: e.revisions + 1,
    erreurs: e.erreurs + (note === 0 ? 1 : 0),
  };
}

/** Intervalle qu'aurait la carte pour chaque note (affiché sur les boutons). */
export function apercuIntervalles(etat: EtatCarte | undefined, carte: Pick<Carte, 'oeuvreId' | 'type'>, maintenant: Date): Record<Note, string> {
  const libelle = (n: Note) => {
    const j = noter(etat, carte, n, maintenant).intervalle;
    if (j === 0) return `${MINUTES_A_REVOIR} min`;
    if (j < 30) return `${j} j`;
    if (j < 365) return `${Math.round(j / 30)} mois`;
    return `${(j / 365).toFixed(1).replace('.', ',')} an`;
  };
  return { 0: libelle(0), 1: libelle(1), 2: libelle(2), 3: libelle(3) };
}

/** Fin de la journée locale : une carte qui échoit aujourd'hui est due dès ce matin. */
function finDeJournee(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

function debutDeJournee(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export const estDue = (etat: EtatCarte, maintenant: Date) => new Date(etat.echeance).getTime() <= finDeJournee(maintenant);

/**
 * Nom court du lieu de conservation, si l'œuvre est dans un musée (et non en place, ni dispersée) :
 * « Musée Guimet, Paris (MG 14910) » devient « Musée Guimet, Paris ».
 */
export function museeDe(conservation: string): string | undefined {
  const court = conservation.split(/ \(|;/)[0].trim();
  if (!court || /^(in situ|plusieurs|nombreux|feuillets|exemplaires|détruit)/i.test(court)) return undefined;
  return /mus[eé]|museum|gallery|galerie|collection/i.test(court) ? court : undefined;
}

/** Cartes possibles pour une fiche : il faut une image ; chaque variante demande l'information correspondante. */
export function cartesDe(o: Oeuvre): TypeCarte[] {
  if (!o.imagePrincipaleId) return [];
  const types: TypeCarte[] = ['identifier'];
  if (o.periodeId && periodeParId(o.periodeId)) types.push('periode');
  if (o.site.trim()) types.push('site');
  if (museeDe(o.conservation)) types.push('musee');
  if (o.iconographie.trim()) types.push('iconographie');
  return types;
}

export interface OptionsSeance {
  maintenant: Date;
  /** Nombre maximal de cartes jamais vues. */
  nouvelles: number;
  /** Nombre maximal de cartes au total. */
  maximum: number;
  aireId?: string;
  hasard?: () => number;
}

export function melanger<T>(liste: T[], hasard: () => number = Math.random): T[] {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** Un sujet de révision (œuvre ou terme) et les types de cartes qu'il permet. */
export interface Sujet {
  id: string;
  types: TypeCarte[];
}

/**
 * Compose une séance : d'abord les cartes dues (les plus en retard d'abord), puis des cartes de second
 * niveau (QCM) pour des sujets déjà vus un jour précédent, puis des sujets jamais vus.
 * Une seule carte par sujet et par séance, pour ne pas révéler la réponse d'une carte par l'autre.
 */
export function composer(sujets: Sujet[], etats: EtatCarte[], o: OptionsSeance, premier: TypeCarte, seconds: TypeCarte[]): Carte[] {
  const parId = new Map(etats.map((e) => [e.id, e]));
  const dues: Carte[] = [];
  const nouvelles: Carte[] = [];
  for (const sujet of sujets) {
    for (const type of sujet.types) {
      const etat = parId.get(idCarte(sujet.id, type));
      const carte = { id: idCarte(sujet.id, type), oeuvreId: sujet.id, type, etat };
      if (!etat) nouvelles.push(carte);
      else if (estDue(etat, o.maintenant)) dues.push(carte);
    }
  }
  dues.sort((a, b) => a.etat!.echeance.localeCompare(b.etat!.echeance));
  const nouvellesTriees = melanger(nouvelles, o.hasard);

  const seance: Carte[] = [];
  const pris = new Set<string>();
  const ajouter = (c: Carte) => {
    if (seance.length >= o.maximum || pris.has(c.oeuvreId)) return false;
    seance.push(c);
    pris.add(c.oeuvreId);
    return true;
  };
  for (const c of dues) ajouter(c);
  // QCM pour des sujets déjà connus (vus un jour précédent) : 5 au plus par séance.
  let qcm = 0;
  for (const c of nouvellesTriees) {
    if (!seconds.includes(c.type) || qcm >= QCM_PAR_SEANCE) continue;
    const vu = parId.get(idCarte(c.oeuvreId, premier));
    if (!vu || new Date(vu.derniereRevision).getTime() >= debutDeJournee(o.maintenant)) continue;
    if (ajouter(c)) qcm++;
  }
  // Puis les sujets jamais vus, selon le nombre choisi.
  let n = 0;
  for (const c of nouvellesTriees) {
    if (n >= o.nouvelles) break;
    if (c.type === premier && ajouter(c)) n++;
  }
  return melanger(seance, o.hasard);
}

/** Séance sur les œuvres (fiches illustrées), éventuellement limitée à une aire. */
export function composerSeance(oeuvres: Oeuvre[], etats: EtatCarte[], o: OptionsSeance): Carte[] {
  const sujets = oeuvres.filter((x) => !o.aireId || x.aireId === o.aireId).map((x) => ({ id: x.id, types: cartesDe(x) }));
  return composer(sujets, etats, o, 'identifier', VARIANTES_OEUVRE);
}

/** Bilan pour l'accueil : cartes dues aujourd'hui, nouvelles disponibles, œuvres maîtrisées. */
export function bilan(oeuvres: Oeuvre[], etats: EtatCarte[], maintenant: Date) {
  const parId = new Map(etats.map((e) => [e.id, e]));
  let dues = 0;
  let nouvelles = 0;
  let sansImage = 0;
  for (const o of oeuvres) {
    const types = cartesDe(o);
    if (types.length === 0) sansImage++;
    for (const t of types) {
      const e = parId.get(idCarte(o.id, t));
      if (!e) {
        if (t === 'identifier') nouvelles++;
      } else if (estDue(e, maintenant)) dues++;
    }
  }
  const maitrisees = oeuvres.filter((o) => {
    const e = parId.get(idCarte(o.id, 'identifier'));
    return e && e.intervalle >= SEUIL_MAITRISE;
  }).length;
  return { dues, nouvelles, maitrisees, sansImage };
}

/** Choix du QCM : la bonne période et trois leurres, de préférence de la même aire et d'époques proches. */
export function optionsPeriode(periodeId: string, hasard: () => number = Math.random): string[] {
  const bonne = periodeParId(periodeId);
  if (!bonne) return [];
  const milieu = (p: { debut: number; fin: number }) => (p.debut + p.fin) / 2;
  const autres = PERIODES.filter((p) => p.id !== bonne.id)
    .map((p) => ({ p, score: (p.aireId === bonne.aireId ? 0 : 1500) + Math.abs(milieu(p) - milieu(bonne)) + hasard() * 400 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((x) => x.p.id);
  return melanger([bonne.id, ...autres], hasard);
}

/** Choix distincts : la bonne réponse et trois leurres, d'abord pris parmi les « proches », puis ailleurs. */
function choixDistincts(bonne: string, proches: string[], autres: string[], hasard: () => number): string[] {
  const vus = new Set([bonne]);
  const leurres: string[] = [];
  for (const v of [...melanger(proches, hasard), ...melanger(autres, hasard)]) {
    if (leurres.length >= 3) break;
    if (v && !vus.has(v)) {
      vus.add(v);
      leurres.push(v);
    }
  }
  return melanger([bonne, ...leurres], hasard);
}

/** QCM « D'où provient cette œuvre ? » : sites d'autres fiches, de la même aire de préférence. */
export function optionsSite(oeuvre: Oeuvre, toutes: Oeuvre[], hasard: () => number = Math.random): string[] {
  const autres = toutes.filter((o) => o.id !== oeuvre.id && o.site.trim());
  return choixDistincts(
    oeuvre.site,
    autres.filter((o) => o.aireId === oeuvre.aireId).map((o) => o.site),
    autres.filter((o) => o.aireId !== oeuvre.aireId).map((o) => o.site),
    hasard,
  );
}

const MUSEES_DE_SECOURS = [
  'Musée Guimet, Paris',
  'Musée national, New Delhi',
  'Indian Museum, Kolkata',
  'Musée national du Cambodge, Phnom Penh',
  'British Museum, Londres',
  'Musée national d’Indonésie, Jakarta',
];

/** QCM « Où est conservée cette œuvre ? » : musées des autres fiches, puis quelques grands musées. */
export function optionsMusee(oeuvre: Oeuvre, toutes: Oeuvre[], hasard: () => number = Math.random): string[] {
  const bonne = museeDe(oeuvre.conservation);
  if (!bonne) return [];
  const musees = (liste: Oeuvre[]) => liste.map((o) => museeDe(o.conservation)).filter((m): m is string => !!m);
  const autres = toutes.filter((o) => o.id !== oeuvre.id);
  return choixDistincts(bonne, musees(autres.filter((o) => o.aireId === oeuvre.aireId)), [...musees(autres), ...MUSEES_DE_SECOURS], hasard);
}
