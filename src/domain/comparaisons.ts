/** Révision des comparaisons : deux images côte à côte, puis les critères qui les distinguent. */
import { type Comparaison, COMPARAISONS } from '../data/comparaisons';
import { type Carte, composer, type EtatCarte, type OptionsSeance } from './revision';
import type { Oeuvre } from './types';

/** Comparaisons révisables : les deux fiches existent et ont une image. */
export function comparaisonsDisponibles(oeuvres: Oeuvre[], liste: Comparaison[] = COMPARAISONS): Comparaison[] {
  const illustrees = new Set(oeuvres.filter((o) => o.imagePrincipaleId).map((o) => o.id));
  return liste.filter((c) => illustrees.has(c.a) && illustrees.has(c.b));
}

export function composerSeanceComparaisons(oeuvres: Oeuvre[], etats: EtatCarte[], o: OptionsSeance): Carte[] {
  const sujets = comparaisonsDisponibles(oeuvres).map((c) => ({ id: c.id, types: ['comparaison' as const] }));
  return composer(sujets, etats, o, 'comparaison', []);
}

export const comparaisonParId = (id: string) => COMPARAISONS.find((c) => c.id === id);

/** Comparaisons où figure une fiche, avec l'autre œuvre de la paire. */
export function comparaisonsDe(oeuvreId: string): Array<{ comparaison: Comparaison; autre: string }> {
  return COMPARAISONS.filter((c) => c.a === oeuvreId || c.b === oeuvreId).map((c) => ({ comparaison: c, autre: c.a === oeuvreId ? c.b : c.a }));
}
