/**
 * Projection sans QCM : couverture du programme, mémorisation (répétition espacée), notes des sujets blancs,
 * rythme (heures faites, date de couverture estimée) et indicateurs « prêt pour l'écrit / l'oral ».
 * Ce sont des repères, pas des notes garanties. Logique pure.
 */
import type { TypeEpreuve } from '../data/sujets';
import { AIRES, PERIODES } from './catalogue';
import { type Copie, noteRetenue } from './examen';
import type { Oral } from './oral';
import { ajouterJours, cleJour, ecartJours, estFaite, lundiDe, type Seance, type TypeSeance } from './plan';
import { estDue, type EtatCarte } from './revision';
import type { Oeuvre } from './types';

/** Une période est couverte quand au moins ce nombre de ses œuvres est maîtrisé. */
export const SEUIL_OEUVRES_PERIODE = 2;
/** Intervalle (jours) à partir duquel une carte est considérée comme maîtrisée. */
const SEUIL_MAITRISE = 21;

export const GROUPES = [
  { id: 'inde', nom: 'l’Inde, le Gandhāra et l’Himalaya', aires: ['inde-nord', 'inde-sud', 'gandhara', 'bengale', 'sri-lanka', 'himalaya'] },
  { id: 'sud-est', nom: 'l’Asie du Sud-Est', aires: ['cambodge', 'champa', 'java', 'birmanie-thai'] },
];

const borne = (x: number) => Math.min(1, Math.max(0, x));
const moyenne = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);

// ——— Couverture ———

export interface CouverturePeriode {
  periodeId: string;
  aireId: string;
  fiches: number;
  maitrisees: number;
  couverte: boolean;
}

export interface CouvertureAire {
  aireId: string;
  total: number;
  couvertes: number;
  /** Périodes commencées (au moins une œuvre maîtrisée) mais pas encore couvertes. */
  enCours: number;
  maitrisees: number;
  /** Œuvres maîtrisées qui manquent pour couvrir toutes les périodes. */
  manquantes: number;
  /** Fiches à créer, faute d'œuvres en nombre suffisant dans certaines périodes. */
  aCreer: number;
}

export interface Couverture {
  periodes: CouverturePeriode[];
  aires: CouvertureAire[];
  couvertes: number;
  total: number;
}

const maitrisee = (e?: EtatCarte) => !!e && e.intervalle >= SEUIL_MAITRISE;

export function couvertureProgramme(oeuvres: Oeuvre[], etats: EtatCarte[]): Couverture {
  const parCarte = new Map(etats.map((e) => [e.id, e]));
  const periodes = PERIODES.map((p) => {
    const fiches = oeuvres.filter((o) => o.periodeId === p.id);
    const m = fiches.filter((o) => maitrisee(parCarte.get(`${o.id}:identifier`))).length;
    return { periodeId: p.id, aireId: p.aireId, fiches: fiches.length, maitrisees: m, couverte: m >= SEUIL_OEUVRES_PERIODE };
  });
  const aires = AIRES.map((a) => {
    const ps = periodes.filter((p) => p.aireId === a.id);
    return {
      aireId: a.id,
      total: ps.length,
      couvertes: ps.filter((p) => p.couverte).length,
      enCours: ps.filter((p) => !p.couverte && p.maitrisees > 0).length,
      maitrisees: ps.reduce((t, p) => t + p.maitrisees, 0),
      manquantes: ps.reduce((t, p) => t + Math.max(0, SEUIL_OEUVRES_PERIODE - p.maitrisees), 0),
      aCreer: ps.reduce((t, p) => t + Math.max(0, SEUIL_OEUVRES_PERIODE - p.fiches), 0),
    };
  });
  return { periodes, aires, couvertes: periodes.filter((p) => p.couverte).length, total: periodes.length };
}

// ——— Mémorisation ———

export interface Memorisation {
  total: number;
  vues: number;
  maitrisees: number;
  /** Part des réponses justes (toutes révisions confondues). */
  reussite?: number;
  enRetard: number;
  glossaire: number;
  anglais: number;
}

function maitriseLexique(etats: EtatCarte[], prefixe: string, total: number) {
  if (!total) return 0;
  return new Set(etats.filter((e) => e.oeuvreId.startsWith(prefixe) && maitrisee(e)).map((e) => e.oeuvreId)).size / total;
}

export function memorisation(oeuvres: Oeuvre[], etats: EtatCarte[], totaux: { glossaire: number; anglais: number }, maintenant = new Date()): Memorisation {
  const parCarte = new Map(etats.map((e) => [e.id, e]));
  const cartes = oeuvres.map((o) => parCarte.get(`${o.id}:identifier`)).filter((e): e is EtatCarte => !!e);
  const desOeuvres = etats.filter((e) => !/^(gl|en|cmp)-/.test(e.oeuvreId));
  const revisions = desOeuvres.reduce((t, e) => t + e.revisions, 0);
  const erreurs = desOeuvres.reduce((t, e) => t + e.erreurs, 0);
  return {
    total: oeuvres.length,
    vues: cartes.length,
    maitrisees: cartes.filter(maitrisee).length,
    reussite: revisions ? 1 - erreurs / revisions : undefined,
    enRetard: desOeuvres.filter((e) => estDue(e, maintenant) && e.echeance < ajouterJours(cleJour(maintenant), -2)).length,
    glossaire: maitriseLexique(etats, 'gl-', totaux.glossaire),
    anglais: maitriseLexique(etats, 'en-', totaux.anglais),
  };
}

// ——— Historique et rythme de couverture ———

/** Photo quotidienne de la progression, pour mesurer le rythme. */
export interface Instantane {
  date: string;
  maitrisees: Record<string, number>;
  manquantes: Record<string, number>;
}

export function instantane(c: Couverture, date: string): Instantane {
  return {
    date,
    maitrisees: Object.fromEntries(c.aires.map((a) => [a.aireId, a.maitrisees])),
    manquantes: Object.fromEntries(c.aires.map((a) => [a.aireId, a.manquantes])),
  };
}

/** Ajoute (ou remplace) la photo du jour ; garde un an d'historique. */
export function ajouterInstantane(historique: Instantane[], i: Instantane): Instantane[] {
  return [...historique.filter((h) => h.date !== i.date), i].sort((a, b) => a.date.localeCompare(b.date)).slice(-400);
}

export const RECUL_MIN = 7;
const FENETRE = 28;

export interface ProjectionCouverture {
  nom: string;
  manquantes: number;
  /** Œuvres maîtrisées gagnées par semaine. */
  parSemaine?: number;
  /** Date estimée de couverture complète, si la progression le permet. */
  date?: string;
  etat: 'couvert' | 'estime' | 'stagne' | 'pas-de-recul';
  /** Avant ou après la date de référence (les écrits). */
  avantEcrits?: boolean;
}

export function projeterCouverture(
  nom: string,
  aires: string[],
  historique: Instantane[],
  actuel: Instantane,
  aujourdhui: string,
  dateEcrits: string,
): ProjectionCouverture {
  const somme = (r: Record<string, number>) => aires.reduce((t, a) => t + (r[a] ?? 0), 0);
  const manquantes = somme(actuel.manquantes);
  if (manquantes === 0) return { nom, manquantes, etat: 'couvert', avantEcrits: aujourdhui <= dateEcrits };
  // Point de départ : la photo la plus ancienne des 28 derniers jours, avec au moins 7 jours de recul.
  const depart = historique.find((h) => ecartJours(h.date, aujourdhui) <= FENETRE && ecartJours(h.date, aujourdhui) >= RECUL_MIN);
  if (!depart) return { nom, manquantes, etat: 'pas-de-recul' };
  const jours = ecartJours(depart.date, aujourdhui);
  const gain = somme(actuel.maitrisees) - somme(depart.maitrisees);
  if (gain <= 0) return { nom, manquantes, parSemaine: 0, etat: 'stagne' };
  const parJour = gain / jours;
  const date = ajouterJours(aujourdhui, Math.ceil(manquantes / parJour));
  return { nom, manquantes, parSemaine: parJour * 7, date, etat: 'estime', avantEcrits: date <= dateEcrits };
}

/** Date à partir de laquelle la projection sera possible. */
export const projectionPossibleLe = (historique: Instantane[], aujourdhui: string) => ajouterJours(historique[0]?.date ?? aujourdhui, RECUL_MIN);

// ——— Notes ———

export interface NoteSujet {
  copieId: string;
  type: TypeEpreuve;
  date: string;
  sujet: string;
  note: number;
  source: 'correcteur' | 'ia';
}

export function notesDesSujets(copies: Copie[]): NoteSujet[] {
  return copies
    .filter((c) => c.type !== 'plan')
    .flatMap((c) => {
      const n = noteRetenue(c);
      return n ? [{ copieId: c.id, type: c.type as TypeEpreuve, date: cleJour(new Date(c.fin ?? c.debut)), sujet: c.sujet, note: n.note, source: n.source }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface TendanceNotes {
  type: TypeEpreuve;
  nombre: number;
  /** Moyenne des 3 dernières notes : le niveau actuel. */
  recente?: number;
  /** Écart avec la moyenne des 3 précédentes. */
  evolution?: number;
}

export function tendance(notes: NoteSujet[], type: TypeEpreuve): TendanceNotes {
  const n = notes.filter((x) => x.type === type).map((x) => x.note);
  const recentes = n.slice(-3);
  const precedentes = n.slice(-6, -3);
  const r = moyenne(recentes);
  const p = moyenne(precedentes);
  return { type, nombre: n.length, recente: r, evolution: r !== undefined && p !== undefined ? r - p : undefined };
}

// ——— Rythme : heures faites par rapport au plan ———

export interface SemaineRythme {
  lundi: string;
  prevues: number;
  faites: number;
}

const TRAVAIL = (s: Seance) => s.type !== 'jalon' && s.type !== 'repos';

/** Minutes prévues et faites par semaine (jusqu'à aujourd'hui), pour les dernières semaines. */
export function rythme(seances: Seance[], activites: (jour: string) => Set<TypeSeance>, aujourdhui: string, semaines = 6): SemaineRythme[] {
  const lundi = lundiDe(aujourdhui);
  return Array.from({ length: semaines }, (_, i) => ajouterJours(lundi, -7 * (semaines - 1 - i))).map((l) => {
    const dans = seances.filter((s) => TRAVAIL(s) && s.date >= l && s.date < ajouterJours(l, 7) && s.date <= aujourdhui);
    return {
      lundi: l,
      prevues: dans.reduce((t, s) => t + s.dureeMin, 0),
      faites: dans.filter((s) => estFaite(s, activites(s.date))).reduce((t, s) => t + s.dureeMin, 0),
    };
  });
}

// ——— Prêt pour l'écrit / l'oral ———

export interface Composante {
  nom: string;
  /** 0 à 1 ; absente si rien ne permet encore de la mesurer. */
  valeur?: number;
  poids: number;
  detail: string;
}

export interface Preparation {
  id: string;
  nom: string;
  score: number;
  niveau: string;
  composantes: Composante[];
  /** Une composante au moins n'est pas encore mesurable. */
  incomplet: boolean;
}

/** 6/20 ou moins : rien ; 14/20 ou plus : prêt. */
export const noteVersPreparation = (n: number) => borne((n - 6) / 8);

export function niveau(score: number): string {
  if (score < 0.35) return 'À construire';
  if (score < 0.6) return 'En progrès';
  if (score < 0.8) return 'Presque prêt';
  return 'Prêt';
}

function preparation(id: string, nom: string, composantes: Composante[]): Preparation {
  const mesurees = composantes.filter((c) => c.valeur !== undefined);
  const poids = mesurees.reduce((t, c) => t + c.poids, 0);
  const score = poids ? mesurees.reduce((t, c) => t + c.valeur! * c.poids, 0) / poids : 0;
  return { id, nom, score, niveau: niveau(score), composantes, incomplet: mesurees.length < composantes.length };
}

const pct = (x: number) => `${Math.round(x * 100)} %`;
const fmtNote = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')}/20`;

export interface Bilans {
  ecrit: Preparation[];
  oral: Preparation[];
  globalEcrit: Preparation;
  globalOral: Preparation;
}

export function pretPour(d: { couverture: Couverture; memo: Memorisation; notes: NoteSujet[]; oraux: Oral[] }): Bilans {
  const couv = d.couverture.total ? d.couverture.couvertes / d.couverture.total : 0;
  const memo = d.memo.total ? d.memo.maitrisees / d.memo.total : 0;
  const cCouv: Composante = { nom: 'Couverture du programme', valeur: couv, poids: 0.35, detail: `${d.couverture.couvertes} périodes sur ${d.couverture.total}` };
  const cMemo: Composante = { nom: 'Mémorisation des œuvres', valeur: memo, poids: 0.25, detail: `${d.memo.maitrisees} œuvres maîtrisées sur ${d.memo.total}` };
  const cNotes = (type: TypeEpreuve, poids: number): Composante => {
    const t = tendance(d.notes, type);
    return {
      nom: 'Notes des sujets blancs',
      valeur: t.recente === undefined ? undefined : noteVersPreparation(t.recente),
      poids,
      detail: t.recente === undefined ? 'pas encore de copie notée' : t.nombre === 1 ? `${fmtNote(t.recente)} sur une seule copie` : `${fmtNote(t.recente)} sur les ${Math.min(3, t.nombre)} dernières`,
    };
  };
  const cEntrainement = (n: number, poids: number, quoi: string): Composante => ({ nom: 'Entraînement', valeur: borne(n / 6), poids, detail: `${n} ${quoi} (objectif : 6)` });
  const nbCopies = (t: TypeEpreuve) => d.notes.filter((x) => x.type === t).length;
  const anglais: Composante = { nom: 'Vocabulaire anglais maîtrisé', valeur: d.memo.anglais, poids: 1, detail: pct(d.memo.anglais) };

  const ecrit = [
    preparation('specialite', 'Dissertation de spécialité', [cCouv, cMemo, cNotes('specialite', 0.4)]),
    preparation('culture', 'Culture générale', [cNotes('culture', 0.7), cEntrainement(nbCopies('culture'), 0.3, 'copies notées')]),
    preparation('synthese', 'Note de synthèse', [cNotes('synthese', 0.7), cEntrainement(nbCopies('synthese'), 0.3, 'copies notées')]),
    preparation('langue', 'Langue vivante (anglais)', [anglais]),
  ];
  const notesOral = d.oraux.filter((o) => o.bilan).map((o) => o.bilan!.noteSur20);
  const recentesOral = moyenne(notesOral.slice(-3));
  const oral = [
    preparation('dossier', 'Oral sur dossier et entretien', [
      {
        nom: 'Bilans des oraux blancs',
        valeur: recentesOral === undefined ? undefined : noteVersPreparation(recentesOral),
        poids: 0.45,
        detail: recentesOral === undefined ? 'pas encore de bilan' : notesOral.length === 1 ? `${fmtNote(recentesOral)} sur un seul oral` : `${fmtNote(recentesOral)} sur les ${Math.min(3, notesOral.length)} derniers`,
      },
      cEntrainement(d.oraux.filter((o) => o.phase === 'termine').length, 0.2, 'oraux blancs'),
      { ...cCouv, poids: 0.2 },
      { ...cMemo, poids: 0.15 },
    ]),
    preparation('langue-oral', 'Langue vivante à l’oral (anglais)', [anglais]),
  ];
  const global = (id: string, nom: string, liste: Preparation[]) =>
    preparation(
      id,
      nom,
      liste.map((p) => ({ nom: p.nom, valeur: p.composantes.some((c) => c.valeur !== undefined) ? p.score : undefined, poids: 1, detail: p.niveau })),
    );
  return { ecrit, oral, globalEcrit: global('ecrit', 'Prêt pour l’écrit', ecrit), globalOral: global('oral', 'Prêt pour l’oral', oral) };
}
