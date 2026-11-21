/** Indicateurs de progression calculés à partir des fiches (sans quiz pour l'instant). */
import { PERIODES } from './catalogue';
import type { Oeuvre } from './types';

const CHAMPS: Array<keyof Oeuvre> = ['datation', 'periodeId', 'aireId', 'site', 'materiau', 'conservation', 'iconographie', 'style', 'notes'];

/** Part des rubriques remplies d'une fiche (0 à 1), image comprise. */
export function completude(o: Oeuvre): number {
  const remplis = CHAMPS.filter((c) => {
    const v = o[c];
    return typeof v === 'string' ? v.trim() !== '' : v !== undefined;
  }).length;
  return (remplis + (o.imagePrincipaleId ? 1 : 0)) / (CHAMPS.length + 1);
}

/**
 * Couverture d'une aire : part de ses périodes du catalogue qui ont au moins une fiche.
 * Sans aire : couverture de tout le programme.
 */
export function couverture(oeuvres: Oeuvre[], aireId?: string): { couvertes: number; total: number } {
  const periodes = PERIODES.filter((p) => !aireId || p.aireId === aireId);
  const presentes = new Set(oeuvres.map((o) => o.periodeId));
  return { couvertes: periodes.filter((p) => presentes.has(p.id)).length, total: periodes.length };
}

/** Jours restants avant une date (AAAA-MM-JJ), 0 si elle est passée. */
export function joursAvant(date: string, aujourdhui = new Date()): number {
  const cible = new Date(`${date}T00:00:00`);
  const debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Math.max(0, Math.round((cible.getTime() - debut.getTime()) / 86_400_000));
}
