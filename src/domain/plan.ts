/**
 * Plan de révision hebdomadaire, sur le modèle du générateur de plans de JeSuisCoach :
 * charge progressive, semaine allégée toutes les 4 semaines, affûtage avant les écrits, puis bascule sur l'oral.
 * Les séances sont réparties selon les jours et le temps disponibles, et pondérées par les lacunes mesurées. Logique pure.
 */
import { SECTIONS_GUIMET } from '../data/preparation';
import type { TypeEpreuve } from '../data/sujets';
import { AIRES, aireParId } from './catalogue';
import { couverture } from './progression';
import { type Copie, noteRetenue } from './examen';
import type { Oral } from './oral';
import type { Lecture, Visite } from './preparation';
import type { EtatCarte } from './revision';
import type { Oeuvre } from './types';

// ——— Dates (AAAA-MM-JJ, heure locale) ———

const deux = (n: number) => String(n).padStart(2, '0');
export const cleJour = (d: Date) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
export const dateDe = (jour: string) => new Date(`${jour}T00:00:00`);
export const ajouterJours = (jour: string, n: number) => {
  const d = dateDe(jour);
  d.setDate(d.getDate() + n);
  return cleJour(d);
};
export const ecartJours = (a: string, b: string) => Math.round((dateDe(b).getTime() - dateDe(a).getTime()) / 86_400_000);
/** 0 = lundi … 6 = dimanche. */
export const jourSemaine = (jour: string) => (dateDe(jour).getDay() + 6) % 7;
export const lundiDe = (jour: string) => ajouterJours(jour, -jourSemaine(jour));

export const NOMS_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// ——— Types ———

export type TypeSeance =
  | 'identifier'
  | 'glossaire'
  | 'comparer'
  | 'reperes'
  | 'lecture'
  | 'fiches'
  | 'plan15'
  | 'sujet-blanc'
  | 'anglais'
  | 'visite'
  | 'oral'
  | 'situations'
  | 'repos'
  | 'jalon';

export const NOMS_SEANCES: Record<TypeSeance, string> = {
  identifier: 'Identifier les œuvres',
  glossaire: 'Glossaire',
  comparer: 'Comparaisons',
  reperes: 'Repères',
  lecture: 'Lecture',
  fiches: 'Fiches',
  plan15: 'Plan en 15 minutes',
  'sujet-blanc': 'Sujet blanc',
  anglais: 'Anglais',
  visite: 'Visite de musée',
  oral: 'Oral blanc',
  situations: 'Mises en situation',
  repos: 'Repos',
  jalon: 'Jalon',
};

export type Phase = 'fond' | 'affutage' | 'ecrits' | 'pause' | 'pre-oral' | 'oral';

export const NOMS_PHASES: Record<Phase, string> = {
  fond: 'Travail de fond',
  affutage: 'Affûtage avant les écrits',
  ecrits: 'Écrits',
  pause: 'Pause après les écrits',
  'pre-oral': 'Préparation de l’oral (en attendant les résultats)',
  oral: 'Préparation de l’oral',
};

export interface Seance {
  id: string;
  date: string;
  type: TypeSeance;
  phase: Phase;
  titre: string;
  description: string;
  dureeMin: number;
  aireId?: string;
  epreuve?: TypeEpreuve;
  lectureId?: string;
  sections?: string[];
  faite?: boolean;
  faiteLe?: string;
}

export interface Jalon {
  id: string;
  date: string;
  nom: string;
}

export interface DemandePlan {
  debut: string;
  dateEcrits: string;
  /** Résultats d'admissibilité : la bascule sur l'oral. */
  dateAdmissibilite: string;
  dateOral: string;
  /** Jours de travail (0 = lundi … 6 = dimanche). */
  jours: number[];
  /** Jours où une longue plage est possible (sujet blanc, visite, oral blanc). */
  joursLongs: number[];
  minutesCourtes: number;
  minutesLongues: number;
  dureeSujetBlanc: number;
  /** Visite de musée toutes les n semaines (0 : pas de visite). */
  visitesToutesLes: number;
  /** Démarches et autres échéances (inscriptions, convocation…). */
  jalons: Jalon[];
}

export function demandeParDefaut(dateEcrits: string, aujourdhui = cleJour(new Date())): DemandePlan {
  return {
    debut: aujourdhui,
    dateEcrits,
    // Estimations à corriger avec le calendrier officiel.
    dateAdmissibilite: ajouterJours(dateEcrits, 56),
    dateOral: ajouterJours(dateEcrits, 84),
    jours: [0, 1, 2, 3, 4, 5],
    joursLongs: [5],
    minutesCourtes: 60,
    minutesLongues: 240,
    dureeSujetBlanc: 240,
    visitesToutesLes: 4,
    jalons: [],
  };
}

// ——— Lacunes ———

export interface LacuneAire {
  aireId: string;
  /** 0 : maîtrisée ; 1 : tout à faire. */
  score: number;
  raison: string;
}

export interface Lacunes {
  aires: LacuneAire[];
  glossaire: number;
  anglais: number;
  comparaisons: number;
  epreuves: Record<TypeEpreuve, number>;
  oral: number;
  /** Phrases à afficher : ce que l'appli a mesuré. */
  constats: string[];
}

const SEUIL_MAITRISE = 21;
const borne = (x: number) => Math.min(1, Math.max(0, x));

function maitriseLexique(etats: EtatCarte[], prefixe: string, total: number): number {
  if (!total) return 0;
  const cartes = etats.filter((e) => e.oeuvreId.startsWith(prefixe) && (e.type === 'terme' || e.type === 'comparaison'));
  const vus = new Set(cartes.map((e) => e.oeuvreId)).size;
  const acquis = new Set(cartes.filter((e) => e.intervalle >= SEUIL_MAITRISE).map((e) => e.oeuvreId)).size;
  return borne((0.7 * acquis + 0.3 * vus) / total);
}

function noteMoyenne(notes: number[]): number | undefined {
  return notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : undefined;
}

/** Une moyenne de 14/20 ou plus ne compte plus comme lacune ; sans évaluation, lacune moyenne. */
const lacuneNote = (moyenne?: number) => (moyenne === undefined ? 0.6 : borne((14 - moyenne) / 8));

export function mesurerLacunes(d: {
  oeuvres: Oeuvre[];
  etats: EtatCarte[];
  copies: Copie[];
  oraux: Oral[];
  totalGlossaire: number;
  totalAnglais: number;
  totalComparaisons: number;
}): Lacunes {
  const parCarte = new Map(d.etats.map((e) => [e.id, e]));
  const aires: LacuneAire[] = AIRES.map((a) => {
    const fiches = d.oeuvres.filter((o) => o.aireId === a.id);
    const cov = couverture(d.oeuvres, a.id);
    const partCouverte = cov.total ? cov.couvertes / cov.total : 1;
    if (fiches.length === 0) return { aireId: a.id, score: 1, raison: 'aucune fiche' };
    const etats = fiches.map((o) => parCarte.get(`${o.id}:identifier`)).filter((e): e is EtatCarte => !!e);
    const vues = etats.length / fiches.length;
    const maitrisees = etats.filter((e) => e.intervalle >= SEUIL_MAITRISE).length / fiches.length;
    const revisions = etats.reduce((t, e) => t + e.revisions, 0);
    const erreurs = revisions ? etats.reduce((t, e) => t + e.erreurs, 0) / revisions : 0;
    const score = borne(0.65 * (1 - (0.6 * maitrisees + 0.4 * vues)) + 0.25 * (1 - partCouverte) + 0.3 * erreurs);
    const raison =
      vues < 0.5
        ? `${Math.round((1 - vues) * 100)} % des œuvres jamais révisées`
        : erreurs > 0.3
          ? `${Math.round(erreurs * 100)} % d’erreurs en révision`
          : partCouverte < 0.5
            ? `${cov.total - cov.couvertes} période${cov.total - cov.couvertes > 1 ? 's' : ''} sans fiche`
            : `${Math.round(maitrisees * 100)} % des œuvres maîtrisées`;
    return { aireId: a.id, score, raison };
  }).sort((a, b) => b.score - a.score);

  const notes = (t: TypeEpreuve) => noteMoyenne(d.copies.filter((c) => c.type === t).flatMap((c) => noteRetenue(c)?.note ?? []));
  const moyennes = { specialite: notes('specialite'), culture: notes('culture'), synthese: notes('synthese') };
  const moyenneOral = noteMoyenne(d.oraux.filter((o) => o.bilan).map((o) => o.bilan!.noteSur20));
  const l: Lacunes = {
    aires,
    glossaire: 1 - maitriseLexique(d.etats, 'gl-', d.totalGlossaire),
    anglais: 1 - maitriseLexique(d.etats, 'en-', d.totalAnglais),
    comparaisons: 1 - maitriseLexique(d.etats, 'cmp-', d.totalComparaisons),
    epreuves: { specialite: lacuneNote(moyennes.specialite), culture: lacuneNote(moyennes.culture), synthese: lacuneNote(moyennes.synthese) },
    oral: lacuneNote(moyenneOral),
    constats: [],
  };
  const faibles = aires.filter((a) => a.score >= 0.4).slice(0, 3);
  if (faibles.length) l.constats.push(`Aires à travailler : ${faibles.map((a) => `${aireParId(a.aireId)?.nom} (${a.raison})`).join(', ')}.`);
  l.constats.push(`Glossaire maîtrisé à ${Math.round((1 - l.glossaire) * 100)} %, vocabulaire anglais à ${Math.round((1 - l.anglais) * 100)} %.`);
  const fmt = (m?: number) => (m === undefined ? 'pas encore de copie corrigée' : `${m.toFixed(1).replace('.', ',')}/20 en moyenne`);
  l.constats.push(`Dissertation de spécialité : ${fmt(moyennes.specialite)} ; culture générale : ${fmt(moyennes.culture)} ; synthèse : ${fmt(moyennes.synthese)}.`);
  l.constats.push(`Oral : ${moyenneOral === undefined ? 'pas encore de bilan' : `${moyenneOral.toFixed(1).replace('.', ',')}/20 en moyenne`}.`);
  return l;
}

// ——— Génération ———

const SEMAINES_AFFUTAGE = 5;

export function phaseDu(jour: string, d: Pick<DemandePlan, 'dateEcrits' | 'dateAdmissibilite' | 'dateOral'>): Phase | undefined {
  if (jour >= d.dateOral) return undefined;
  if (jour === d.dateEcrits) return 'ecrits';
  if (jour < ajouterJours(d.dateEcrits, -7 * SEMAINES_AFFUTAGE)) return 'fond';
  if (jour < d.dateEcrits) return 'affutage';
  if (jour <= ajouterJours(d.dateEcrits, 7)) return 'pause';
  if (jour < d.dateAdmissibilite) return 'pre-oral';
  return 'oral';
}

/** Charge de la semaine (comme JeSuisCoach) : progression, semaine allégée toutes les 4 semaines, affûtage. */
export function chargeSemaine(lundi: string, d: DemandePlan): number {
  const phase = phaseDu(lundi, d) ?? phaseDu(ajouterJours(lundi, 6), d);
  if (phase === 'fond') {
    const debut = lundiDe(d.debut);
    const finFond = ajouterJours(d.dateEcrits, -7 * SEMAINES_AFFUTAGE);
    const total = Math.max(1, Math.round(ecartJours(debut, finFond) / 7));
    const w = Math.round(ecartJours(debut, lundi) / 7);
    let f = 0.75 + 0.35 * Math.min(1, total > 1 ? w / (total - 1) : 1);
    if (w % 4 === 3) f *= 0.8;
    return f;
  }
  if (phase === 'affutage') return ecartJours(lundi, d.dateEcrits) < 7 ? 0.6 : 1;
  if (phase === 'pause') return 0.3;
  if (phase === 'pre-oral') return 0.6;
  return 1;
}

interface Bloc {
  type: TypeSeance;
  duree: number;
  poids: number;
}

const DUREES: Partial<Record<TypeSeance, number>> = {
  identifier: 20,
  glossaire: 15,
  comparer: 20,
  reperes: 15,
  lecture: 25,
  fiches: 25,
  plan15: 30,
  anglais: 15,
  situations: 30,
  oral: 75,
};

function blocsDeLaPhase(phase: Phase, l: Lacunes): Bloc[] {
  const ajust = (x: number) => 0.5 + x;
  const aireFaible = l.aires[0]?.score ?? 0.5;
  const b = (type: TypeSeance, poids: number): Bloc => ({ type, duree: DUREES[type] ?? 30, poids });
  switch (phase) {
    case 'fond':
      return [
        b('lecture', 3),
        b('fiches', 2 * ajust(aireFaible)),
        b('glossaire', 2 * ajust(l.glossaire)),
        b('comparer', 1.5 * ajust(l.comparaisons)),
        b('reperes', 1.5),
        b('plan15', 1 * ajust(l.epreuves.specialite)),
        b('anglais', 1 * ajust(l.anglais)),
      ];
    case 'affutage':
      return [
        b('plan15', 3 * ajust(Math.max(l.epreuves.specialite, l.epreuves.culture))),
        b('glossaire', 2 * ajust(l.glossaire)),
        b('reperes', 2),
        b('comparer', 2 * ajust(l.comparaisons)),
        b('anglais', 1 * ajust(l.anglais)),
        { ...b('lecture', 0.5), duree: 30 },
      ];
    case 'pre-oral':
      return [b('situations', 3 * ajust(l.oral)), b('anglais', 2 * ajust(l.anglais)), b('lecture', 1), b('comparer', 1)];
    case 'oral':
      return [b('situations', 3 * ajust(l.oral)), b('oral', 2 * ajust(l.oral)), b('anglais', 2 * ajust(l.anglais)), b('comparer', 1), b('reperes', 1)];
    default:
      return [];
  }
}

/** Choix proportionnel aux poids, déterministe (round-robin pondéré « lissé »). */
class Tourniquet {
  private credits = new Map<TypeSeance, number>();
  constructor(private blocs: Bloc[]) {}
  suivant(reste: number, exclus: Set<TypeSeance>): Bloc | undefined {
    const possibles = this.blocs.filter((b) => b.duree <= reste && !exclus.has(b.type));
    if (!possibles.length) return undefined;
    const total = possibles.reduce((t, b) => t + b.poids, 0);
    for (const b of possibles) this.credits.set(b.type, (this.credits.get(b.type) ?? 0) + b.poids);
    const choisi = possibles.reduce((m, b) => ((this.credits.get(b.type) ?? 0) > (this.credits.get(m.type) ?? 0) ? b : m));
    this.credits.set(choisi.type, (this.credits.get(choisi.type) ?? 0) - total);
    return choisi;
  }
}

const arrondi5 = (m: number) => Math.max(15, Math.round(m / 5) * 5);

let compteur = 0;
const nouvelId = () => `s${Date.now().toString(36)}${(compteur++).toString(36)}`;

export interface ContextePlan {
  lacunes: Lacunes;
  lectures: Lecture[];
  /** Nombre de fiches par aire (identification impossible sans fiche). */
  fichesParAire: Record<string, number>;
}

/** Génère toutes les séances, du début du plan à la veille de l'oral. */
export function genererPlan(d: DemandePlan, ctx: ContextePlan): Seance[] {
  const seances: Seance[] = [];
  const jours = new Set(d.jours);
  const longs = new Set(d.joursLongs.filter((j) => jours.has(j)));
  const l = ctx.lacunes;
  const airesCibles = l.aires.filter((a) => a.score >= 0.3).map((a) => a.aireId);
  const airesAvecFiches = airesCibles.filter((a) => (ctx.fichesParAire[a] ?? 0) > 0);
  const airesSansFiche = l.aires.filter((a) => (ctx.fichesParAire[a.aireId] ?? 0) < 3).map((a) => a.aireId);
  const lecturesEnCours = ctx.lectures.filter((x) => x.statut === 'en-cours');
  const lecturesALire = [...ctx.lectures.filter((x) => x.statut === 'a-lire')].sort(
    (a, b) => Number(b.aires.some((x) => airesCibles.includes(x))) - Number(a.aires.some((x) => airesCibles.includes(x))),
  );
  const lecturesProposees = [...lecturesEnCours, ...lecturesALire];
  const tourniquets = new Map<Phase, Tourniquet>();
  const compteurs = { identifier: 0, fiches: 0, lecture: 0, visite: 0, sujet: 0, oral: 0 };
  // Épreuves des sujets blancs : la plus faible revient plus souvent.
  const epreuves: TypeEpreuve[] = (['specialite', 'culture', 'synthese'] as TypeEpreuve[]).flatMap((e) => Array(1 + Math.round(l.epreuves[e] * 2)).fill(e));
  const sectionsVisitees: string[] = [];

  const ajouter = (s: Omit<Seance, 'id'>) => seances.push({ ...s, id: nouvelId() });

  const seance = (jour: string, phase: Phase, type: TypeSeance, duree: number): Omit<Seance, 'id'> => {
    const base = { date: jour, phase, type, dureeMin: duree };
    switch (type) {
      case 'identifier': {
        const aireId = airesAvecFiches.length ? airesAvecFiches[compteurs.identifier++ % Math.min(3, airesAvecFiches.length)] : undefined;
        const aire = aireParId(aireId)?.nom;
        return {
          ...base,
          aireId,
          titre: aire ? `Identifier : ${aire}` : 'Identifier les œuvres',
          description: `Révision du jour (répétition espacée)${aire ? `, centrée sur ${aire}` : ''} : identifier, dater, situer.`,
        };
      }
      case 'fiches': {
        const aireId = airesSansFiche[compteurs.fiches++ % Math.max(1, airesSansFiche.length)];
        const aire = aireParId(aireId)?.nom ?? 'ton programme';
        return { ...base, aireId, titre: `Fiches : ${aire}`, description: `Crée ou complète 2 fiches d’œuvres pour ${aire} (images, notices de musées, points à retenir).` };
      }
      case 'lecture': {
        const lecture = lecturesProposees.length ? lecturesProposees[compteurs.lecture++ % Math.min(2, lecturesProposees.length)] : undefined;
        if (phase === 'affutage')
          return { ...base, titre: 'Relire tes notes de lecture', description: 'Pas de nouvelle lecture avant les écrits : relis tes notes et les œuvres citées.' };
        return {
          ...base,
          lectureId: lecture?.id,
          titre: lecture ? `Lecture : ${lecture.titre}` : 'Lecture',
          description: lecture
            ? `${duree} min de lecture${lecture.pageActuelle ? `, reprends p. ${lecture.pageActuelle + 1}` : ''}. Note les œuvres citées et relie-les à tes fiches.`
            : `${duree} min de lecture : choisis un ouvrage dans ta bibliographie.`,
        };
      }
      case 'plan15':
        return { ...base, titre: 'Plan en 15 minutes', description: 'Un sujet au hasard : problématique et plan détaillé, puis relecture du commentaire.' };
      case 'glossaire':
        return { ...base, titre: 'Glossaire en cartes', description: 'Gestes, attributs, montures, architecture : les cartes du jour.' };
      case 'comparer':
        return { ...base, titre: 'Comparer deux œuvres', description: 'Une ou deux comparaisons, critère par critère.' };
      case 'reperes':
        return { ...base, titre: 'Quiz de repères', description: 'Dynasties par siècle et sites sur la carte.' };
      case 'anglais':
        return { ...base, titre: 'Vocabulaire anglais', description: 'Les fiches mémo du jour pour l’épreuve de langue.' };
      case 'situations':
        return { ...base, titre: 'Mises en situation professionnelle', description: 'Un oral court : réponds à voix haute aux questions de motivation et de mise en situation, puis réécoute-toi.' };
      case 'oral':
        return { ...base, titre: 'Oral blanc', description: 'Dossier tiré au hasard : préparation, exposé enregistré, questions du jury, puis réécoute.' };
      default:
        return { ...base, titre: NOMS_SEANCES[type], description: '' };
    }
  };

  const visite = (jour: string, phase: Phase): Omit<Seance, 'id'> => {
    // Sections liées aux aires les plus faibles, en évitant de revoir toujours les mêmes.
    const classees = [...SECTIONS_GUIMET].sort((a, b) => {
      const score = (s: (typeof SECTIONS_GUIMET)[number]) =>
        Math.max(0, ...s.aires.map((x) => l.aires.find((y) => y.aireId === x)?.score ?? 0)) - sectionsVisitees.filter((v) => v === s.id).length * 0.5;
      return score(b) - score(a);
    });
    const sections = classees.slice(0, 2);
    sectionsVisitees.push(...sections.map((s) => s.id));
    compteurs.visite++;
    return {
      date: jour,
      phase,
      type: 'visite',
      dureeMin: Math.min(180, Math.max(90, d.minutesLongues)),
      sections: sections.map((s) => s.id),
      titre: `Visite au Guimet : ${sections.map((s) => s.nom).join(', ')}`,
      description: 'Regarde les œuvres comme au concours (identifier, dater, situer), photographie 5 à 10 œuvres et transforme-les en fiches depuis le journal de visite.',
    };
  };

  const finPlan = ajouterJours(d.dateOral, -1);
  for (let jour = d.debut; jour <= finPlan; jour = ajouterJours(jour, 1)) {
    const phase = phaseDu(jour, d);
    if (!phase || phase === 'ecrits') continue;
    const js = jourSemaine(jour);
    if (!jours.has(js)) continue;
    const lundi = lundiDe(jour);
    const charge = chargeSemaine(lundi, d);
    const semaine = Math.round(ecartJours(lundiDe(d.debut), lundi) / 7);
    const long = longs.has(js);
    const avantEcrits = ecartJours(jour, d.dateEcrits);
    const avantOral = ecartJours(jour, d.dateOral);

    if (phase === 'pause') {
      if (js === Math.min(...jours))
        ajouter({ date: jour, phase, type: 'repos', dureeMin: 0, titre: 'Repos', description: 'Semaine de récupération après les écrits : repos, lectures plaisir, une visite si l’envie te prend.' });
      continue;
    }
    if ((phase === 'affutage' && avantEcrits === 1) || (phase === 'oral' && avantOral === 1)) {
      ajouter({ date: jour, phase, type: 'repos', dureeMin: 0, titre: 'Veille de l’épreuve', description: 'Pas de travail nouveau : relis quelques fiches, prépare tes affaires, couche-toi tôt.' });
      continue;
    }

    const dispo = long ? d.minutesLongues : d.minutesCourtes;
    let budget = Math.min(dispo, arrondi5(dispo * charge));
    const exclus = new Set<TypeSeance>();

    // Plage longue de la semaine (une seule, sauf en affûtage et pour l'oral).
    if (long) {
      const premierLong = [...longs].sort((a, b) => a - b)[0] === js;
      const visitePrevue = d.visitesToutesLes > 0 && (phase === 'fond' || phase === 'pre-oral' || phase === 'oral') && semaine % d.visitesToutesLes === 1 % d.visitesToutesLes;
      const finAffutage = phase === 'affutage' && avantEcrits <= 4;
      if (premierLong && visitePrevue) {
        ajouter(visite(jour, phase));
        continue;
      }
      const sujetPossible = d.minutesLongues >= d.dureeSujetBlanc && !finAffutage;
      if ((phase === 'affutage' || (phase === 'fond' && semaine % 2 === 0 && premierLong)) && sujetPossible) {
        const epreuve = epreuves[compteurs.sujet++ % epreuves.length];
        ajouter({
          date: jour,
          phase,
          type: 'sujet-blanc',
          epreuve,
          dureeMin: d.dureeSujetBlanc,
          titre: `Sujet blanc : ${epreuve === 'specialite' ? 'dissertation de spécialité' : epreuve === 'culture' ? 'culture générale' : 'note de synthèse'}`,
          description: 'En conditions réelles : chronomètre, sans documents, puis correction par l’IA ou par un pair.',
        });
        continue;
      }
      if ((phase === 'oral' || (phase === 'pre-oral' && semaine % 2 === 0)) && budget >= 75) {
        ajouter({ ...seance(jour, phase, 'oral', 75) });
        budget -= 75;
        exclus.add('oral');
      }
    }

    // Révision espacée quotidienne, puis blocs selon les poids.
    if (phase !== 'pre-oral' || budget >= 45) {
      const duree = Math.min(budget, phase === 'oral' || phase === 'pre-oral' ? 15 : 20);
      if (duree >= 15) {
        ajouter(seance(jour, phase, 'identifier', duree));
        budget -= duree;
      }
    }
    let t = tourniquets.get(phase);
    if (!t) tourniquets.set(phase, (t = new Tourniquet(blocsDeLaPhase(phase, l))));
    for (let bloc = t.suivant(budget, exclus); bloc && budget >= 15; bloc = t.suivant(budget, exclus)) {
      // Une lecture s'allonge s'il reste du temps (jusqu'à 45 min, 90 min sur une plage longue).
      const duree = bloc.type === 'lecture' && phase !== 'affutage' ? Math.min(long ? 90 : 45, budget) : bloc.duree;
      ajouter(seance(jour, phase, bloc.type, duree));
      budget -= duree;
      exclus.add(bloc.type);
    }
  }

  const jalon = (date: string, nom: string, description: string) =>
    date >= d.debut && ajouter({ date, phase: phaseDu(date, d) ?? 'oral', type: 'jalon', dureeMin: 0, titre: nom, description });
  jalon(d.dateEcrits, 'Écrits', 'Date des écrits (estimation à corriger quand le calendrier officiel sera publié).');
  jalon(d.dateAdmissibilite, 'Résultats d’admissibilité', 'Estimation : bascule du plan sur l’oral.');
  jalon(d.dateOral, 'Oraux', 'Estimation : début des épreuves orales.');
  for (const j of d.jalons) jalon(j.date, j.nom, 'Démarche ou échéance ajoutée par toi.');
  return seances.sort((a, b) => a.date.localeCompare(b.date) || Number(b.type === 'jalon') - Number(a.type === 'jalon'));
}

/** Régénère à partir d'aujourd'hui en gardant les séances passées et celles déjà faites (comme JeSuisCoach). */
export function regenererPlan(anciennes: Seance[], d: DemandePlan, ctx: ContextePlan, aujourdhui: string): Seance[] {
  const gardees = anciennes.filter((s) => s.type !== 'jalon' && (s.date < aujourdhui || s.faite));
  const neuves = genererPlan({ ...d, debut: aujourdhui > d.debut ? aujourdhui : d.debut }, ctx);
  const faitesDuJour = new Set(gardees.filter((s) => s.date >= aujourdhui).map((s) => `${s.date}|${s.type}`));
  const jalonsPasses = anciennes.filter((s) => s.type === 'jalon' && s.date < aujourdhui);
  return [...jalonsPasses, ...gardees, ...neuves.filter((s) => !faitesDuJour.has(`${s.date}|${s.type}`))].sort(
    (a, b) => a.date.localeCompare(b.date) || Number(b.type === 'jalon') - Number(a.type === 'jalon'),
  );
}

// ——— Suivi ———

/** Types de séances dont l'appli voit l'activité un jour donné (révisions, copies, oraux, visites, lectures). */
export function activitesDuJour(
  jour: string,
  d: { etats: EtatCarte[]; copies: Copie[]; oraux: Oral[]; visites: Visite[]; lectures: Lecture[] },
): Set<TypeSeance> {
  const faits = new Set<TypeSeance>();
  const revues = d.etats.filter((e) => e.derniereRevision.slice(0, 10) === jour);
  const compte = (f: (e: EtatCarte) => boolean) => revues.filter(f).length;
  if (compte((e) => !/^(gl|en|cmp)-/.test(e.oeuvreId) && (e.type === 'identifier' || e.type === 'periode' || e.type === 'site')) >= 3) faits.add('identifier');
  if (compte((e) => e.oeuvreId.startsWith('gl-')) >= 3) faits.add('glossaire');
  if (compte((e) => e.oeuvreId.startsWith('en-')) >= 3) faits.add('anglais');
  if (compte((e) => e.oeuvreId.startsWith('cmp-')) >= 1) faits.add('comparer');
  if (compte((e) => e.type === 'dynastie' || e.type === 'carte') >= 3) faits.add('reperes');
  const debutLe = (iso: string) => cleJour(new Date(iso)) === jour;
  for (const c of d.copies) if (debutLe(c.debut) && c.fin) faits.add(c.type === 'plan' ? 'plan15' : 'sujet-blanc');
  for (const o of d.oraux)
    if (debutLe(o.debut)) {
      faits.add('oral');
      faits.add('situations');
    }
  if (d.visites.some((v) => v.date === jour)) faits.add('visite');
  if (d.lectures.some((l) => l.historique.some((h) => cleJour(new Date(h.date)) === jour))) faits.add('lecture');
  return faits;
}

export const estFaite = (s: Seance, activites: Set<TypeSeance>) => !!s.faite || (s.type !== 'jalon' && s.type !== 'repos' && activites.has(s.type));
