/** Révision du glossaire : cartes « terme » (auto-évaluation) et « definition » (QCM du terme). */
import { type CategorieGlossaire, GLOSSAIRE, type Terme } from '../data/glossaire';
import { type Carte, composer, type EtatCarte, estDue, idCarte, melanger, type OptionsSeance, SEUIL_MAITRISE } from './revision';

export function composerSeanceGlossaire(
  termes: Terme[],
  etats: EtatCarte[],
  o: OptionsSeance & { categorie?: CategorieGlossaire },
): Carte[] {
  const sujets = termes.filter((t) => !o.categorie || t.categorie === o.categorie).map((t) => ({ id: t.id, types: ['terme', 'definition'] as const }));
  return composer(
    sujets.map((s) => ({ ...s, types: [...s.types] })),
    etats,
    o,
    'terme',
    'definition',
  );
}

export function bilanGlossaire(termes: Terme[], etats: EtatCarte[], maintenant: Date) {
  const parId = new Map(etats.map((e) => [e.id, e]));
  let dues = 0;
  let nouveaux = 0;
  let maitrises = 0;
  for (const t of termes) {
    const e = parId.get(idCarte(t.id, 'terme'));
    if (!e) nouveaux++;
    else if (e.intervalle >= SEUIL_MAITRISE) maitrises++;
    for (const type of ['terme', 'definition'] as const) {
      const x = parId.get(idCarte(t.id, type));
      if (x && estDue(x, maintenant)) dues++;
    }
  }
  return { dues, nouveaux, maitrises };
}

/** Le bon terme et trois leurres de la même catégorie (complétés par d'autres catégories s'il le faut). */
export function optionsTermes(termeId: string, hasard: () => number = Math.random, glossaire: Terme[] = GLOSSAIRE): string[] {
  const bon = glossaire.find((t) => t.id === termeId);
  if (!bon) return [];
  const memeCategorie = melanger(glossaire.filter((t) => t.id !== bon.id && t.categorie === bon.categorie), hasard);
  const autres = melanger(glossaire.filter((t) => t.categorie !== bon.categorie), hasard);
  const leurres = [...memeCategorie, ...autres].slice(0, 3).map((t) => t.id);
  return melanger([bon.id, ...leurres], hasard);
}

export const termeParId = (id: string) => GLOSSAIRE.find((t) => t.id === id);

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Recherche sans accents dans les termes et les définitions ; les termes qui commencent par la requête d'abord. */
export function chercherTermes(requete: string, categorie?: CategorieGlossaire, glossaire: Terme[] = GLOSSAIRE): Terme[] {
  const q = normaliser(requete.trim());
  const liste = glossaire.filter((t) => !categorie || t.categorie === categorie);
  if (!q) return [...liste].sort((a, b) => normaliser(a.terme).localeCompare(normaliser(b.terme)));
  const score = (t: Terme) => (normaliser(t.terme).startsWith(q) ? 0 : normaliser(t.terme).includes(q) ? 1 : normaliser(t.definition).includes(q) ? 2 : 3);
  return liste
    .map((t) => ({ t, s: score(t) }))
    .filter((x) => x.s < 3)
    .sort((a, b) => a.s - b.s || normaliser(a.t.terme).localeCompare(normaliser(b.t.terme)))
    .map((x) => x.t);
}

/** Termes du glossaire illustrés par une fiche. */
export const termesDeFiche = (oeuvreId: string) => GLOSSAIRE.filter((t) => t.exemples?.includes(oeuvreId));
