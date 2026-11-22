/** Mode examen : sujets, copies, grilles de correction et lecture des réponses de l'IA. Logique pure. */
import { SUJETS_PROPOSES, type TypeEpreuve } from '../data/sujets';

export type SourceSujet = 'propose' | 'jury' | 'perso' | 'ia';

export interface Sujet {
  id: string;
  type: TypeEpreuve;
  intitule: string;
  source: SourceSujet;
  /** Pour un sujet de jury : « Rapport de jury 2022 », année… */
  precision?: string;
  creeLe?: string;
}

export const NOMS_SOURCES: Record<SourceSujet, string> = {
  propose: 'Sujet d’entraînement proposé',
  jury: 'Rapport de jury',
  perso: 'Ajouté par toi',
  ia: 'Généré par l’IA',
};

export const sujetsProposes = (): Sujet[] => SUJETS_PROPOSES.map((s) => ({ ...s, source: 'propose' as const }));

export type TypeCopie = TypeEpreuve | 'plan';

export interface CritereCorrection {
  critere: string;
  /** Note sur 5. */
  note: number;
  commentaire: string;
}

export interface Correction {
  criteres: CritereCorrection[];
  noteSur20: number;
  appreciation: string;
  pointsForts: string[];
  aAmeliorer: string[];
  conseils: string[];
  corrigeeLe: string;
}

export interface CommentairePlan {
  appreciation: string;
  problematique: string;
  plan: string;
  pointsForts: string[];
  aAmeliorer: string[];
  planPropose: { problematique: string; parties: Array<{ titre: string; sousParties: string[] }> };
  commenteLe: string;
}

export interface NoteCorrecteur {
  note: number;
  correcteur: string;
  commentaire?: string;
  le: string;
}

export interface Copie {
  id: string;
  type: TypeCopie;
  sujetId: string;
  /** Intitulé au moment de la copie (le sujet peut être modifié ensuite). */
  sujet: string;
  /** « texte » : rédigée dans l'appli ; « manuscrit » : sur papier, puis photographiée. */
  mode: 'texte' | 'manuscrit';
  debut: string;
  fin?: string;
  dureePrevueMin: number;
  texte: string;
  problematique?: string;
  plan?: string;
  /** Fichiers (photos de la copie manuscrite) dans la table `fichiers`. */
  photos: string[];
  correction?: Correction;
  /** Note d'un correcteur (enseignant, pair), qui prime sur celle de l'IA. */
  noteCorrecteur?: NoteCorrecteur;
  commentairePlan?: CommentairePlan;
  modifieeLe: string;
}

/** Grilles de critères par épreuve, transmises à l'IA. */
export const GRILLES: Record<TypeEpreuve, string[]> = {
  specialite: [
    'Problématique (pertinence, définition des termes du sujet)',
    'Structure et plan (progression, équilibre, transitions)',
    'Précision des exemples (dates, lieux, dynasties)',
    'Références aux œuvres (choix, description, analyse)',
    'Expression et rigueur (langue, vocabulaire technique)',
  ],
  culture: [
    'Problématique (analyse du sujet, enjeux)',
    'Structure et plan (progression, équilibre, transitions)',
    'Précision des exemples (variété, exactitude)',
    'Références culturelles et aux œuvres (patrimoine, musées, textes)',
    'Expression et rigueur (langue, clarté)',
  ],
  synthese: [
    'Fidélité au dossier (aucun ajout extérieur, pas de contresens)',
    'Problématique et structure',
    'Exhaustivité (idées essentielles de tous les documents)',
    'Concision et respect du format',
    'Expression et objectivité',
  ],
};

export const NOTE_CRITERE_MAX = 5;

/** Durées proposées (minutes). Celles du concours 2027 seront fixées par l'arrêté. */
export const DUREES = [60, 120, 180, 240, 300];
export const DUREE_PAR_DEFAUT = 240;
export const DUREE_PLAN = 15;

/** Temps restant en secondes (négatif si dépassé), à partir du début enregistré : survit aux rechargements. */
export function secondesRestantes(debut: string, dureeMin: number, maintenant = Date.now()): number {
  return Math.round((new Date(debut).getTime() + dureeMin * 60_000 - maintenant) / 1000);
}

export function formatChrono(secondes: number): string {
  const s = Math.abs(secondes);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${secondes < 0 ? '−' : ''}${h > 0 ? `${h}:` : ''}${deux(m)}:${deux(sec)}`;
}

export const formatDuree = (min: number) => (min < 60 ? `${min} min` : min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60)} h ${min % 60}`);

export function compterMots(texte: string): number {
  return (texte.match(/[\p{L}\p{N}’'-]+/gu) ?? []).length;
}

/** Tire un sujet au hasard parmi ceux d'un type, en évitant si possible les derniers faits. */
export function tirerSujet(sujets: Sujet[], type: TypeEpreuve, dejaFaits: string[] = [], hasard: () => number = Math.random): Sujet | undefined {
  const candidats = sujets.filter((s) => s.type === type);
  const neufs = candidats.filter((s) => !dejaFaits.includes(s.id));
  const liste = neufs.length ? neufs : candidats;
  return liste[Math.floor(hasard() * liste.length)];
}

// ——— Formats de réponse demandés à l'IA (sorties structurées) ———

const liste = { type: 'array', items: { type: 'string' } } as const;

export const SCHEMA_CORRECTION = {
  type: 'object',
  additionalProperties: false,
  required: ['criteres', 'note_sur_20', 'appreciation', 'points_forts', 'a_ameliorer', 'conseils'],
  properties: {
    criteres: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['critere', 'note', 'commentaire'],
        properties: { critere: { type: 'string' }, note: { type: 'number' }, commentaire: { type: 'string' } },
      },
    },
    note_sur_20: { type: 'number' },
    appreciation: { type: 'string' },
    points_forts: liste,
    a_ameliorer: liste,
    conseils: liste,
  },
} as const;

export const SCHEMA_PLAN = {
  type: 'object',
  additionalProperties: false,
  required: ['appreciation', 'problematique', 'plan', 'points_forts', 'a_ameliorer', 'plan_propose'],
  properties: {
    appreciation: { type: 'string' },
    problematique: { type: 'string' },
    plan: { type: 'string' },
    points_forts: liste,
    a_ameliorer: liste,
    plan_propose: {
      type: 'object',
      additionalProperties: false,
      required: ['problematique', 'parties'],
      properties: {
        problematique: { type: 'string' },
        parties: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['titre', 'sous_parties'],
            properties: { titre: { type: 'string' }, sous_parties: liste },
          },
        },
      },
    },
  },
} as const;

export const SCHEMA_SUJETS = {
  type: 'object',
  additionalProperties: false,
  required: ['sujets'],
  properties: { sujets: liste },
} as const;

// ——— Lecture et vérification des réponses de l'IA ———

const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const textes = (v: unknown) => (Array.isArray(v) ? v.map(texte).filter(Boolean) : []);
const borne = (n: unknown, max: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n * 2) / 2)) : 0);

export function lireCorrection(json: unknown, maintenant = new Date()): Correction {
  const r = (json ?? {}) as Record<string, unknown>;
  const criteres = (Array.isArray(r.criteres) ? r.criteres : [])
    .map((c) => c as Record<string, unknown>)
    .map((c) => ({ critere: texte(c.critere), note: borne(c.note, NOTE_CRITERE_MAX), commentaire: texte(c.commentaire) }))
    .filter((c) => c.critere);
  if (criteres.length === 0) throw new Error('Correction incomplète : aucun critère évalué.');
  return {
    criteres,
    noteSur20: borne(r.note_sur_20, 20),
    appreciation: texte(r.appreciation),
    pointsForts: textes(r.points_forts),
    aAmeliorer: textes(r.a_ameliorer),
    conseils: textes(r.conseils),
    corrigeeLe: maintenant.toISOString(),
  };
}

export function lireCommentairePlan(json: unknown, maintenant = new Date()): CommentairePlan {
  const r = (json ?? {}) as Record<string, unknown>;
  const pp = (r.plan_propose ?? {}) as Record<string, unknown>;
  const parties = (Array.isArray(pp.parties) ? pp.parties : [])
    .map((p) => p as Record<string, unknown>)
    .map((p) => ({ titre: texte(p.titre), sousParties: textes(p.sous_parties) }))
    .filter((p) => p.titre);
  if (!texte(r.appreciation) && parties.length === 0) throw new Error('Commentaire vide.');
  return {
    appreciation: texte(r.appreciation),
    problematique: texte(r.problematique),
    plan: texte(r.plan),
    pointsForts: textes(r.points_forts),
    aAmeliorer: textes(r.a_ameliorer),
    planPropose: { problematique: texte(pp.problematique), parties },
    commenteLe: maintenant.toISOString(),
  };
}

export function lireSujetsGeneres(json: unknown): string[] {
  const vus = new Set<string>();
  return textes((json as { sujets?: unknown })?.sujets).filter((s) => {
    const cle = s.toLowerCase();
    if (vus.has(cle) || s.length < 6) return false;
    vus.add(cle);
    return true;
  });
}

/** Note retenue pour une copie : celle du correcteur si elle existe, sinon celle de l'IA. */
export function noteRetenue(c: Copie): { note: number; source: 'correcteur' | 'ia' } | undefined {
  if (c.noteCorrecteur) return { note: c.noteCorrecteur.note, source: 'correcteur' };
  if (c.correction) return { note: c.correction.noteSur20, source: 'ia' };
  return undefined;
}
