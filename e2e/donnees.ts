/**
 * Jeux de données de test : une préparation « en cours » (révisions, copies notées, oral, historique de progression),
 * écrite directement dans la base pour vérifier les calculs (projection, lacunes du plan).
 */
import { GLOSSAIRE } from '../src/data/glossaire';
import { VOCABULAIRE } from '../src/data/anglais';
import { REFERENCES } from '../src/data/references';
import type { EtatCarte } from '../src/domain/revision';

const etat = (oeuvreId: string, type: EtatCarte['type'], intervalle: number, erreurs = 0): EtatCarte => ({
  id: `${oeuvreId}:${type}`,
  oeuvreId,
  type,
  repetitions: intervalle >= 21 ? 5 : 2,
  intervalle,
  facilite: 2.5,
  echeance: intervalle >= 21 ? '2026-12-20T08:00:00.000Z' : '2026-11-25T08:00:00.000Z',
  derniereRevision: '2026-11-20T08:00:00.000Z',
  revisions: 5,
  erreurs,
});

/** 30 œuvres révisées dont 22 maîtrisées ; 20 termes du glossaire et 10 mots d'anglais maîtrisés. */
export const revisions: EtatCarte[] = [
  ...REFERENCES.slice(0, 30).map((r, i) => etat(r.id, 'identifier', i < 22 ? 30 : 3, i % 4 === 0 ? 2 : 0)),
  ...GLOSSAIRE.slice(0, 20).map((t) => etat(t.id, 'terme', 25)),
  ...VOCABULAIRE.slice(0, 10).map((t) => etat(t.id, 'terme', 25)),
];

const copie = (id: string, type: string, jour: string, ia: number, correcteur?: number) => ({
  id,
  type,
  sujetId: 'sp-image-bouddha',
  sujet: `Sujet ${id}`,
  mode: 'texte',
  debut: `${jour}T08:00:00.000Z`,
  fin: `${jour}T12:00:00.000Z`,
  dureePrevueMin: 240,
  texte: 'Copie de test.',
  photos: [],
  correction: { criteres: [{ critere: 'Problématique', note: 3, commentaire: '' }], noteSur20: ia, appreciation: '', pointsForts: [], aAmeliorer: [], conseils: [], corrigeeLe: `${jour}T13:00:00.000Z` },
  noteCorrecteur: correcteur === undefined ? undefined : { note: correcteur, correcteur: 'Prépa', le: `${jour}T13:00:00.000Z` },
  modifieeLe: `${jour}T13:00:00.000Z`,
});

/** Spécialité : 8 ; 9,5 ; 11 ; 12,5 (IA) mais 13 (correcteur). Culture : 13. Pas de synthèse. */
export const copies = [
  copie('c1', 'specialite', '2026-10-05', 8),
  copie('c2', 'specialite', '2026-10-19', 9.5),
  copie('c3', 'specialite', '2026-11-02', 11),
  copie('c4', 'specialite', '2026-11-16', 12.5, 13),
  copie('c5', 'culture', '2026-11-10', 13),
];

export const oraux = [
  {
    id: 'o1',
    dossier: { mode: 'theme', theme: 'Angkor', documents: [], sansCartels: false, consigne: 'Exposé sur Angkor' },
    dureePrepMin: 30,
    dureeEpreuveMin: 30,
    dureeExposeMin: 10,
    phase: 'termine',
    debut: '2026-11-15T09:00:00.000Z',
    fin: '2026-11-15T10:00:00.000Z',
    notes: '',
    exposeTexte: 'Résumé',
    questions: [],
    bilan: { appreciation: 'Bien', noteSur20: 12, pointsForts: [], aAmeliorer: [], conseils: [], parQuestion: [], faitLe: '2026-11-15T10:30:00.000Z' },
    modifieLe: '2026-11-15T10:30:00.000Z',
  },
];

/** Il y a 14 jours : 12 œuvres maîtrisées seulement (les 12 premières). */
export function historique(aireDe: (id: string) => string | undefined) {
  const maitrisees: Record<string, number> = {};
  for (const r of REFERENCES.slice(0, 12)) {
    const a = aireDe(r.id)!;
    maitrisees[a] = (maitrisees[a] ?? 0) + 1;
  }
  return [{ date: '2026-11-09', maitrisees, manquantes: {} }];
}
