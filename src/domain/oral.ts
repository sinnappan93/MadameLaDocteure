/** Simulateur d'oral : dossier, phases et minutage, questions du jury, lecture des réponses de l'IA. Logique pure. */
import { type QuestionBanque, QUESTIONS_MOTIVATION, QUESTIONS_SITUATION, type ThemeOral } from '../data/oral';
import type { Oeuvre } from './types';

export type ModeDossier = 'oeuvres' | 'theme';

/** Copie des informations d'une œuvre au moment du tirage (la fiche peut changer ou disparaître ensuite). */
export interface DocumentDossier {
  oeuvreId: string;
  imageId?: string;
  titre: string;
  datation: string;
  site: string;
  conservation: string;
  materiau: string;
}

export interface DossierOral {
  mode: ModeDossier;
  theme?: string;
  documents: DocumentDossier[];
  /** Cartels masqués : il faut d'abord identifier les œuvres. */
  sansCartels: boolean;
  consigne: string;
}

export type PhaseOral = 'preparation' | 'expose' | 'questions' | 'termine';
export type CategorieQuestion = 'relance' | 'motivation' | 'situation';

export const NOMS_CATEGORIES: Record<CategorieQuestion, string> = {
  relance: 'Relance sur l’exposé',
  motivation: 'Motivation',
  situation: 'Mise en situation professionnelle',
};

export interface QuestionJury {
  id: string;
  categorie: CategorieQuestion;
  question: string;
  /** Pistes attendues, montrées après la réponse. */
  attendu: string;
  /** Enregistrement de la réponse (table `fichiers`). */
  audio?: string;
  dureeSec?: number;
  /** Transcription ou résumé écrit de la réponse. */
  texte?: string;
}

export interface BilanOral {
  appreciation: string;
  noteSur20: number;
  pointsForts: string[];
  aAmeliorer: string[];
  conseils: string[];
  parQuestion: Array<{ question: string; commentaire: string }>;
  faitLe: string;
}

export interface Oral {
  id: string;
  dossier: DossierOral;
  dureePrepMin: number;
  dureeEpreuveMin: number;
  /** Part de l'épreuve consacrée à l'exposé, le reste aux questions. */
  dureeExposeMin: number;
  phase: PhaseOral;
  debut: string;
  debutEpreuve?: string;
  finExpose?: string;
  fin?: string;
  /** Brouillon de préparation (plan, idées). */
  notes: string;
  exposeAudio?: string;
  exposeDureeSec?: number;
  /** Transcription ou résumé de l'exposé. */
  exposeTexte: string;
  questions: QuestionJury[];
  sourceQuestions?: 'ia' | 'banque';
  bilan?: BilanOral;
  modifieLe: string;
}

/** Format de 2015 : 30 minutes de préparation, 30 minutes d'épreuve. La part de l'exposé est une hypothèse réglable. */
export const FORMAT_2015 = { prep: 30, epreuve: 30, expose: 10 };
export const DUREES_PREP = [15, 20, 30, 45, 60];
export const DUREES_EPREUVE = [20, 30, 40, 45, 60];
export const DUREES_EXPOSE = [5, 10, 15, 20];

// ——— Tirage du dossier ———

const normaliser = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function documentDe(o: Oeuvre): DocumentDossier {
  return { oeuvreId: o.id, imageId: o.imagePrincipaleId, titre: o.titre, datation: o.datation, site: o.site, conservation: o.conservation, materiau: o.materiau };
}

function melanger<T>(liste: T[], hasard: () => number): T[] {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** Écart maximal (en années) entre œuvres d'un même dossier, quand c'est possible. */
const ECART_PROCHE = 500;

/**
 * Tire un dossier cohérent : une œuvre pivot, puis des œuvres de la même aire si possible, de périodes différentes.
 * Les œuvres avec une image passent en priorité (c'est ce que le jury montre).
 */
export function tirerOeuvres(oeuvres: Oeuvre[], options: { nombre?: number; aireId?: string; hasard?: () => number } = {}): Oeuvre[] {
  const { nombre = 3, aireId, hasard = Math.random } = options;
  const parmi = aireId ? oeuvres.filter((o) => o.aireId === aireId) : oeuvres;
  const avecImage = parmi.filter((o) => o.imagePrincipaleId);
  const base = avecImage.length >= nombre ? avecImage : parmi;
  if (base.length === 0) return [];
  const pivot = base[Math.floor(hasard() * base.length)];
  const reste = melanger(
    base.filter((o) => o.id !== pivot.id),
    hasard,
  );
  // Même aire et époque proche d'abord (dossier cohérent), en évitant de répéter une période ; puis on élargit.
  const choisis = [pivot];
  const periodes = new Set([pivot.periodeId]);
  const proche = (o: Oeuvre) => o.debut === undefined || pivot.debut === undefined || Math.abs(o.debut - pivot.debut) <= ECART_PROCHE;
  for (const passe of [0, 1, 2, 3]) {
    for (const o of reste) {
      if (choisis.length >= nombre) break;
      if (choisis.includes(o)) continue;
      const memeAire = o.aireId === pivot.aireId;
      const nouvellePeriode = !periodes.has(o.periodeId);
      if ((passe === 0 && memeAire && nouvellePeriode && proche(o)) || (passe === 1 && memeAire && nouvellePeriode) || (passe === 2 && memeAire) || passe === 3) {
        choisis.push(o);
        periodes.add(o.periodeId);
      }
    }
  }
  return choisis;
}

/** Mots significatifs d'un thème saisi à la main. */
export function motsDuTheme(theme: string): string[] {
  return normaliser(theme)
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length > 3 && !['dans', 'entre', 'avec', 'pour', 'leur', 'leurs', 'quel', 'quelle', 'comme', 'depuis'].includes(m));
}

/** Œuvres des fiches qui se rattachent à un thème (par mots-clés), les plus pertinentes d'abord. */
export function oeuvresDuTheme(oeuvres: Oeuvre[], motsCles: string[], nombre = 3): Oeuvre[] {
  const mots = motsCles.map(normaliser).filter(Boolean);
  if (!mots.length) return [];
  const score = (o: Oeuvre) => {
    const titre = normaliser(o.titre);
    const reste = normaliser([o.iconographie, o.style, o.site, o.conservation, o.materiau, ...o.etiquettes].join(' '));
    return mots.reduce((t, m) => t + (titre.includes(m) ? 2 : 0) + (reste.includes(m) ? 1 : 0), 0) + (o.imagePrincipaleId ? 0.5 : 0);
  };
  return oeuvres
    .map((o) => ({ o, s: score(o) }))
    .filter((x) => x.s >= 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, nombre)
    .map((x) => x.o);
}

export function consigneDossier(mode: ModeDossier, n: number, theme?: string): string {
  if (mode === 'theme')
    return `Exposé sur le thème « ${theme} »${n ? `, en t’appuyant notamment sur ${n > 1 ? `les ${n} œuvres du dossier` : 'l’œuvre du dossier'}` : ''}. Dégage une problématique et construis un plan.`;
  return `Présente et commente ce dossier de ${n} œuvre${n > 1 ? 's' : ''} : identifie, date et situe chacune, puis dégage une problématique d’ensemble qui les relie.`;
}

export function creerDossier(mode: ModeDossier, oeuvres: Oeuvre[], sansCartels: boolean, theme?: string | ThemeOral): DossierOral {
  const intitule = typeof theme === 'string' ? theme.trim() : theme?.intitule;
  return { mode, theme: intitule, documents: oeuvres.map(documentDe), sansCartels, consigne: consigneDossier(mode, oeuvres.length, intitule) };
}

// ——— Minutage ———

export interface Minutage {
  phase: PhaseOral;
  /** Chronomètre principal : début et durée (préparation, ou épreuve entière). */
  debut: string;
  dureeMin: number;
  /** Temps restant pour l'exposé (pendant l'exposé seulement). */
  exposeRestantSec?: number;
}

export function minutage(o: Oral, maintenant = Date.now()): Minutage {
  if (o.phase === 'preparation' || !o.debutEpreuve) return { phase: o.phase, debut: o.debut, dureeMin: o.dureePrepMin };
  const m: Minutage = { phase: o.phase, debut: o.debutEpreuve, dureeMin: o.dureeEpreuveMin };
  if (o.phase === 'expose') m.exposeRestantSec = Math.round((new Date(o.debutEpreuve).getTime() + o.dureeExposeMin * 60_000 - maintenant) / 1000);
  return m;
}

// ——— Questions du jury ———

let compteur = 0;
const idQuestion = () => `q${Date.now().toString(36)}${(compteur++).toString(36)}`;

const depuisBanque = (categorie: CategorieQuestion, q: QuestionBanque): QuestionJury => ({ id: idQuestion(), categorie, question: q.question, attendu: q.attendu });

/** Relances génériques, construites à partir du dossier (quand l'IA n'est pas activée). */
export function relancesGeneriques(dossier: DossierOral, hasard: () => number = Math.random): QuestionJury[] {
  const docs = dossier.documents;
  const nom = (d: DocumentDossier, i: number) => (dossier.sansCartels ? `le document ${i + 1}` : `« ${d.titre} »`);
  const modeles: Array<(d: DocumentDossier, i: number) => QuestionBanque> = [
    (d, i) => ({
      question: `Sur quels critères précis datez-vous ${nom(d, i)} ?`,
      attendu: `Critères stylistiques, iconographiques, techniques ou épigraphiques, et comparaisons datées. Repère : ${d.datation || 'voir la fiche'}.`,
    }),
    (d, i) => ({
      question: `Quelle autre œuvre rapprocheriez-vous de ${nom(d, i)}, et pourquoi ?`,
      attendu: 'Une comparaison précise (lieu de conservation, date) qui éclaire un point : atelier, iconographie, diffusion d’un modèle, évolution.',
    }),
    (d, i) => ({
      question: `Que savez-vous de l’histoire de ${nom(d, i)} depuis sa découverte jusqu’à son lieu de conservation actuel ?`,
      attendu: `Contexte de découverte, fouilles ou collecte, entrée dans les collections, questions de provenance. Lieu : ${d.conservation || 'voir la fiche'}.`,
    }),
    (d, i) => ({
      question: `Comment présenteriez-vous ${nom(d, i)} au public dans une salle de musée ?`,
      attendu: 'Choix du cartel et du texte de salle, voisinages, éclairage et conservation préventive (matériau), médiation.',
    }),
  ];
  const questions = melanger(docs, hasard)
    .slice(0, 3)
    .map((d, k) => depuisBanque('relance', modeles[k % modeles.length](d, docs.indexOf(d))));
  if (docs.length === 0 && dossier.theme)
    questions.push(
      depuisBanque('relance', {
        question: `Comment définissez-vous les termes du thème « ${dossier.theme} » ? Quelles bornes chronologiques et géographiques avez-vous retenues ?`,
        attendu: 'Définition précise des termes, bornes justifiées, ce qu’on exclut et pourquoi.',
      }),
      depuisBanque('relance', {
        question: 'Quelle œuvre précise choisiriez-vous pour ouvrir une exposition sur ce thème, et pourquoi ?',
        attendu: 'Une œuvre réelle, bien identifiée (lieu de conservation, date), qui résume l’enjeu du thème.',
      }),
    );
  questions.push(
    depuisBanque('relance', {
      question:
        dossier.mode === 'theme' || docs.length < 2
          ? 'Quelles limites voyez-vous à votre traitement du sujet ? Qu’avez-vous laissé de côté ?'
          : `Votre problématique d’ensemble tient-elle pour les ${docs.length} œuvres ? Laquelle s’y prête le moins ?`,
      attendu: 'Recul critique : reconnaître une faiblesse, proposer un élargissement ou un autre angle.',
    }),
  );
  return questions;
}

/** Questions tirées de la banque : relances génériques, 1 de motivation, 3 de mise en situation. */
export function questionsDeBanque(dossier: DossierOral, hasard: () => number = Math.random): QuestionJury[] {
  return [
    ...relancesGeneriques(dossier, hasard),
    ...melanger(QUESTIONS_MOTIVATION, hasard)
      .slice(0, 1)
      .map((q) => depuisBanque('motivation', q)),
    ...melanger(QUESTIONS_SITUATION, hasard)
      .slice(0, 3)
      .map((q) => depuisBanque('situation', q)),
  ];
}

/** Le dossier tel qu'on le décrit à l'IA. */
export function decrireDossier(dossier: DossierOral): string {
  const lignes = dossier.documents.map(
    (d, i) => `Document ${i + 1} : ${d.titre}${d.datation ? `, ${d.datation}` : ''}${d.materiau ? `, ${d.materiau}` : ''}${d.site ? `, ${d.site}` : ''}${d.conservation ? ` (${d.conservation})` : ''}`,
  );
  return [
    dossier.mode === 'theme' ? `Thème : « ${dossier.theme} »` : 'Dossier d’œuvres à commenter',
    `Consigne donnée à la candidate : ${dossier.consigne}`,
    dossier.sansCartels ? 'Les cartels étaient masqués : la candidate devait identifier les œuvres elle-même.' : '',
    ...lignes,
  ]
    .filter(Boolean)
    .join('\n');
}

// ——— Formats de réponse demandés à l'IA ———

const listeQuestions = {
  type: 'array',
  items: { type: 'object', additionalProperties: false, required: ['question', 'attendu'], properties: { question: { type: 'string' }, attendu: { type: 'string' } } },
} as const;

export const SCHEMA_QUESTIONS_JURY = {
  type: 'object',
  additionalProperties: false,
  required: ['relances', 'motivation', 'situations'],
  properties: { relances: listeQuestions, motivation: listeQuestions, situations: listeQuestions },
} as const;

export const SCHEMA_BILAN_ORAL = {
  type: 'object',
  additionalProperties: false,
  required: ['appreciation', 'note_sur_20', 'points_forts', 'a_ameliorer', 'conseils', 'par_question'],
  properties: {
    appreciation: { type: 'string' },
    note_sur_20: { type: 'number' },
    points_forts: { type: 'array', items: { type: 'string' } },
    a_ameliorer: { type: 'array', items: { type: 'string' } },
    conseils: { type: 'array', items: { type: 'string' } },
    par_question: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['question', 'commentaire'], properties: { question: { type: 'string' }, commentaire: { type: 'string' } } },
    },
  },
} as const;

const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const textes = (v: unknown) => (Array.isArray(v) ? v.map(texte).filter(Boolean) : []);

export function lireQuestionsJury(json: unknown): QuestionJury[] {
  const r = (json ?? {}) as Record<string, unknown>;
  const lire = (v: unknown, categorie: CategorieQuestion, max: number) =>
    (Array.isArray(v) ? v : [])
      .map((q) => q as Record<string, unknown>)
      .map((q) => ({ question: texte(q.question), attendu: texte(q.attendu) }))
      .filter((q) => q.question.length > 8)
      .slice(0, max)
      .map((q) => depuisBanque(categorie, q));
  const questions = [...lire(r.relances, 'relance', 5), ...lire(r.motivation, 'motivation', 3), ...lire(r.situations, 'situation', 5)];
  if (questions.length < 3) throw new Error('Le jury n’a pas posé assez de questions : réessaie.');
  return questions;
}

export function lireBilanOral(json: unknown, maintenant = new Date()): BilanOral {
  const r = (json ?? {}) as Record<string, unknown>;
  const appreciation = texte(r.appreciation);
  if (!appreciation) throw new Error('Bilan incomplet : réessaie.');
  const n = r.note_sur_20;
  return {
    appreciation,
    noteSur20: typeof n === 'number' && Number.isFinite(n) ? Math.min(20, Math.max(0, Math.round(n * 2) / 2)) : 0,
    pointsForts: textes(r.points_forts),
    aAmeliorer: textes(r.a_ameliorer),
    conseils: textes(r.conseils),
    parQuestion: (Array.isArray(r.par_question) ? r.par_question : [])
      .map((q) => q as Record<string, unknown>)
      .map((q) => ({ question: texte(q.question), commentaire: texte(q.commentaire) }))
      .filter((q) => q.commentaire),
    faitLe: maintenant.toISOString(),
  };
}

/** Y a-t-il assez d'écrit (notes, transcriptions, résumés) pour que l'IA fasse un bilan ? L'IA ne peut pas écouter l'audio. */
export function texteDisponible(o: Oral): boolean {
  return !!(o.exposeTexte.trim() || o.questions.some((q) => q.texte?.trim()));
}

export const formatSecondes = (s: number) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Amorce de vocabulaire pour la transcription : noms du dossier (titres, sites, matériaux, datations) et mots
 * marquants des notes de préparation (noms propres, termes à diacritiques), pour aider à reconnaître les noms propres.
 */
const MOTS_COURANTS = new Set(
  'les une des dans pour avec mais donc comment pourquoi quel quelle quels quelles introduction conclusion problématique partie plan ainsi cette ces son sur par'.split(' '),
);

export function vocabulaireOral(o: Pick<Oral, 'dossier' | 'notes'>, longueurMax = 500): string {
  const vus = new Set<string>();
  const termes: string[] = [];
  const ajouter = (t: string | undefined) => {
    const x = t?.replace(/[«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!x || x.length < 3) return;
    const cle = x.toLowerCase();
    if (vus.has(cle)) return;
    vus.add(cle);
    termes.push(x);
  };
  ajouter(o.dossier.theme);
  for (const d of o.dossier.documents) {
    ajouter(d.titre);
    ajouter(d.site.split(',')[0]);
    ajouter(d.materiau);
    ajouter(d.datation);
  }
  for (const mot of o.notes.match(/[\p{L}’'-]+/gu) ?? []) if ((/^\p{Lu}/u.test(mot) && !MOTS_COURANTS.has(mot.toLowerCase())) || /[āīūṛṣṇṭḍñśḥṃ]/i.test(mot)) ajouter(mot);
  let texte = '';
  for (const t of termes) {
    const suivant = texte ? `${texte}, ${t}` : t;
    if (suivant.length > longueurMax) break;
    texte = suivant;
  }
  return texte ? `${texte}.` : '';
}
