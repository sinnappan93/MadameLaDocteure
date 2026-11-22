/** Repères chronologiques et géographiques : siècles, questions de dynasties, distances sur la carte. */
import { PERIODES, type Periode } from './catalogue';
import type { Oeuvre } from './types';

const ROMAINS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII'];

/** Siècle n (négatif avant J.-C.) : bornes en années. Ier siècle = 1–100 ; Ier av. J.-C. = −100 à −1. */
export function bornesSiecle(n: number): [number, number] {
  return n > 0 ? [(n - 1) * 100 + 1, n * 100] : [n * 100, (n + 1) * 100 - 1];
}

export function nomSiecle(n: number): string {
  const r = ROMAINS[Math.abs(n)] ?? String(Math.abs(n));
  const ordinal = Math.abs(n) === 1 ? `${r}er` : `${r}e`;
  return `${ordinal} siècle${n < 0 ? ' av. J.-C.' : ''}`;
}

export function recouvrement(p: Pick<Periode, 'debut' | 'fin'>, [a, b]: [number, number]): number {
  return Math.max(0, Math.min(p.fin, b) - Math.max(p.debut, a));
}

export interface QuestionDynastie {
  /** « rp-cambodge-10 » */
  id: string;
  aireId: string;
  siecle: number;
  periodeId: string;
  /** Lieu précis de la question : « au Cambodge », « en pays tamoul »… */
  lieu: string;
}

/**
 * Questions choisies à la main : le catalogue des périodes est trop simplifié pour les générer
 * automatiquement sans erreur (aires regroupées, dynasties absentes comme les Pratīhāra).
 * Chaque question a une réponse défendable ; le lieu est précisé quand l'aire est large.
 */
const QUESTIONS: Array<[string, number, string, string]> = [
  // [aire, siècle, période, lieu]
  ['inde-nord', -25, 'harappa', 'dans la vallée de l’Indus'],
  ['inde-nord', -22, 'harappa', 'dans la vallée de l’Indus'],
  ['inde-nord', -3, 'maurya', 'dans la plaine du Gange'],
  ['inde-nord', -2, 'shunga', 'dans la plaine du Gange'],
  ['inde-nord', 5, 'gupta', 'dans la plaine du Gange'],
  ['inde-nord', 14, 'sultanats', 'à Delhi'],
  ['inde-nord', 17, 'moghol', 'à Agra et Delhi'],
  ['gandhara', 2, 'kushan', 'au Gandhāra'],
  ['inde-sud', 1, 'satavahana', 'dans le Dekkan'],
  ['inde-sud', 9, 'rashtrakuta', 'dans le Dekkan'],
  ['inde-sud', 7, 'pallava', 'en pays tamoul'],
  ['inde-sud', 11, 'chola', 'en pays tamoul'],
  ['inde-sud', 12, 'hoysala', 'au Karnataka (Belur, Halebid)'],
  ['inde-sud', 16, 'vijayanagara', 'en Inde du Sud'],
  ['bengale', 9, 'pala', 'au Bengale et au Bihar'],
  ['bengale', 10, 'pala', 'au Bengale et au Bihar'],
  ['sri-lanka', -3, 'anuradhapura', 'à Sri Lanka'],
  ['sri-lanka', 5, 'anuradhapura', 'à Sri Lanka'],
  ['sri-lanka', 12, 'polonnaruwa', 'à Sri Lanka'],
  ['cambodge', 6, 'preangkorien', 'au Cambodge'],
  ['cambodge', 10, 'angkor', 'au Cambodge'],
  ['cambodge', 12, 'angkor', 'au Cambodge'],
  ['java', 9, 'java-central', 'à Java central'],
  ['java', 14, 'java-oriental', 'à Java oriental'],
  ['birmanie-thai', 7, 'dvaravati', 'en Thaïlande centrale'],
  ['birmanie-thai', 12, 'pagan', 'en Birmanie'],
  ['birmanie-thai', 14, 'sukhothai', 'en Thaïlande'],
  ['himalaya', 17, 'malla', 'dans la vallée de Katmandou'],
];

export function questionsDynastie(): QuestionDynastie[] {
  return QUESTIONS.map(([aireId, siecle, periodeId, lieu]) => ({ id: `rp-${aireId}-${siecle}`, aireId, siecle, periodeId, lieu }));
}

export const questionDynastieParId = (id: string) => questionsDynastie().find((q) => q.id === id);

export function enonceDynastie(q: QuestionDynastie): string {
  return `Quelle période au ${nomSiecle(q.siecle)} ${q.lieu} ?`;
}

/**
 * Choix : la bonne période, puis de préférence des périodes contemporaines d'autres aires (pièges utiles)
 * et d'autres périodes de la même aire.
 */
export function optionsDynastie(q: QuestionDynastie, hasard: () => number = Math.random): string[] {
  const bornes = bornesSiecle(q.siecle);
  const score = (p: Periode) => {
    const contemporaine = recouvrement(p, bornes) > 0 ? 0 : 1;
    const memeAire = p.aireId === q.aireId ? 0 : 0.5;
    return contemporaine + memeAire + hasard() * 0.9;
  };
  const leurres = PERIODES.filter((p) => p.id !== q.periodeId && !(p.aireId === q.aireId && recouvrement(p, bornes) > 25))
    .map((p) => ({ id: p.id, s: score(p) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, 3)
    .map((x) => x.id);
  const liste = [q.periodeId, ...leurres];
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

/** Distance à vol d'oiseau, en kilomètres (formule de haversine). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Seuil de réussite du quiz de carte. */
export const SEUIL_CARTE_KM = 200;

/** Nom court d'un site, sans précisions entre parenthèses : « Mohenjo-daro (Sind, Pakistan) » → « Mohenjo-daro ». */
export function siteCourt(site: string): string {
  return site.split(' (')[0].split(',')[0].trim() || site;
}

export const surLaCarte = (o: Oeuvre) => o.lat !== undefined && o.lng !== undefined;
