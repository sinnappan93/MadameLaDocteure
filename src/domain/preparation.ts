/** Bibliographie (lectures) et journal des visites de musées. Logique pure. */
import type { SuggestionLecture, TypeLecture } from '../data/preparation';

export type StatutLecture = 'a-lire' | 'en-cours' | 'lu';

export const NOMS_STATUTS: Record<StatutLecture, string> = { 'a-lire': 'À lire', 'en-cours': 'En cours', lu: 'Lu' };

export interface SeanceLecture {
  date: string;
  /** Pages lues jusqu'à (incluse). */
  jusqua: number;
  pages: number;
}

export interface Lecture {
  id: string;
  type: TypeLecture;
  titre: string;
  auteurs: string;
  annee?: number;
  editeur: string;
  /** Lien (catalogue de bibliothèque, Persée, JSTOR…). */
  lien: string;
  pagesTotal?: number;
  /** Dernière page lue. */
  pageActuelle: number;
  statut: StatutLecture;
  notes: string;
  /** Fiches d'œuvres citées dans la lecture. */
  oeuvreIds: string[];
  aires: string[];
  historique: SeanceLecture[];
  suggestionId?: string;
  creeeLe: string;
  modifieeLe: string;
}

export type NouvelleLecture = Omit<Lecture, 'id' | 'creeeLe' | 'modifieeLe' | 'historique' | 'pageActuelle' | 'statut' | 'notes' | 'oeuvreIds'> &
  Partial<Pick<Lecture, 'pageActuelle' | 'statut' | 'notes' | 'oeuvreIds'>>;

export function lectureDeSuggestion(s: SuggestionLecture): NouvelleLecture {
  return { type: s.type, titre: s.titre, auteurs: s.auteurs, annee: s.annee, editeur: s.editeur ?? '', lien: '', aires: s.aires, notes: s.aCompleter ? 'Référence à compléter.' : '', suggestionId: s.id };
}

/** Avancement (0 à 1), si le nombre de pages est connu. */
export function avancement(l: Pick<Lecture, 'pageActuelle' | 'pagesTotal' | 'statut'>): number | undefined {
  if (l.statut === 'lu') return 1;
  if (!l.pagesTotal) return undefined;
  return Math.min(1, Math.max(0, l.pageActuelle / l.pagesTotal));
}

/** Enregistre une séance de lecture : nouvelle page atteinte, statut mis à jour. */
export function lirePages(l: Lecture, jusqua: number, date = new Date()): Pick<Lecture, 'pageActuelle' | 'statut' | 'historique'> {
  const borne = l.pagesTotal ? Math.min(jusqua, l.pagesTotal) : jusqua;
  const pages = Math.max(0, borne - l.pageActuelle);
  const fini = !!l.pagesTotal && borne >= l.pagesTotal;
  return {
    pageActuelle: Math.max(l.pageActuelle, borne),
    statut: fini ? 'lu' : borne > 0 ? 'en-cours' : l.statut,
    historique: pages > 0 ? [...l.historique, { date: date.toISOString(), jusqua: borne, pages }] : l.historique,
  };
}

export const pagesLuesLe = (l: Lecture, jour: string) => l.historique.filter((h) => h.date.slice(0, 10) === jour).reduce((t, h) => t + h.pages, 0);

/** Référence courte : « Huntington 1985 ». */
export function referenceCourte(l: Pick<Lecture, 'auteurs' | 'annee' | 'titre'>): string {
  const nom = l.auteurs.split(/[,;]| et /)[0]?.trim().split(' ').at(-1);
  return nom ? `${nom}${l.annee ? ` ${l.annee}` : ''}` : l.titre;
}

// ——— Visites ———

export interface Visite {
  id: string;
  /** Jour de la visite (AAAA-MM-JJ). */
  date: string;
  musee: string;
  /** Sections ou salles vues (identifiants de SECTIONS_GUIMET ou texte libre). */
  salles: string[];
  notes: string;
  /** Fiches créées à partir des photos prises pendant la visite. */
  oeuvreIds: string[];
  /** Séance du plan à l'origine de la visite. */
  seanceId?: string;
  creeeLe: string;
}
