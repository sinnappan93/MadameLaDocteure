/**
 * Données de la préparation : suggestions de lecture et sections du musée Guimet pour les visites.
 * Les références sont des points de départ : vérifie l'édition exacte (année, éditeur) avant de les citer.
 */

export type TypeLecture = 'livre' | 'catalogue' | 'article' | 'chapitre' | 'rapport';

export const TYPES_LECTURE: Record<TypeLecture, string> = {
  livre: 'Livre',
  catalogue: 'Catalogue d’exposition',
  article: 'Article',
  chapitre: 'Chapitre',
  rapport: 'Rapport de jury',
};

export interface SuggestionLecture {
  id: string;
  type: TypeLecture;
  titre: string;
  auteurs: string;
  annee?: number;
  editeur?: string;
  /** Aires concernées, pour proposer la lecture quand une aire est faible. */
  aires: string[];
  pourquoi: string;
  /** Référence à compléter (titre ou édition incertains). */
  aCompleter?: boolean;
}

export const SUGGESTIONS_LECTURE: SuggestionLecture[] = [
  {
    id: 'sug-lefevre-manuel',
    type: 'livre',
    titre: 'Manuel de Vincent Lefèvre (titre et édition à compléter)',
    auteurs: 'Vincent Lefèvre',
    aires: [],
    pourquoi: 'Le manuel de référence que tu as cité : complète le titre exact, l’éditeur et le nombre de pages.',
    aCompleter: true,
  },
  {
    id: 'sug-gange',
    type: 'catalogue',
    titre: 'Chefs-d’œuvre du delta du Gange (Art of the Ganges Delta)',
    auteurs: 'Vincent Lefèvre, Marie-Françoise Boussac (dir.)',
    annee: 2007,
    editeur: 'Musée Guimet / Réunion des musées nationaux',
    aires: ['bengale'],
    pourquoi: 'Catalogue d’exposition du musée Guimet sur les collections des musées du Bangladesh. Vérifie l’édition que tu utilises.',
    aCompleter: true,
  },
  {
    id: 'sug-huntington',
    type: 'livre',
    titre: 'The Art of Ancient India: Buddhist, Hindu, Jain',
    auteurs: 'Susan L. Huntington',
    annee: 1985,
    editeur: 'Weatherhill',
    aires: ['inde-nord', 'inde-sud', 'gandhara', 'bengale', 'himalaya'],
    pourquoi: 'Synthèse classique sur l’art de l’Inde ancienne et médiévale, très illustrée.',
  },
  {
    id: 'sug-harle',
    type: 'livre',
    titre: 'The Art and Architecture of the Indian Subcontinent',
    auteurs: 'J. C. Harle',
    annee: 1986,
    editeur: 'Penguin (Pelican History of Art), rééd. Yale University Press',
    aires: ['inde-nord', 'inde-sud', 'gandhara', 'sri-lanka'],
    pourquoi: 'Manuel de référence en anglais, de l’époque maurya au XIIIe siècle.',
  },
  {
    id: 'sug-boisselier',
    type: 'livre',
    titre: 'La statuaire khmère et son évolution',
    auteurs: 'Jean Boisselier',
    annee: 1955,
    editeur: 'École française d’Extrême-Orient',
    aires: ['cambodge'],
    pourquoi: 'Ouvrage fondateur pour les styles de la sculpture khmère.',
  },
  {
    id: 'sug-rapports',
    type: 'rapport',
    titre: 'Rapports du jury du concours de conservateur du patrimoine',
    auteurs: 'Institut national du patrimoine',
    aires: [],
    pourquoi: 'Sujets tombés, attentes du jury, conseils de méthode : à lire en priorité, session par session.',
  },
];

/** Sections du musée Guimet (MNAAG) liées aux aires du programme. */
export interface SectionMusee {
  id: string;
  nom: string;
  aires: string[];
}

export const MUSEE_PAR_DEFAUT = 'Musée Guimet (MNAAG), Paris';

export const SECTIONS_GUIMET: SectionMusee[] = [
  { id: 'inde', nom: 'Inde', aires: ['inde-nord', 'inde-sud', 'bengale', 'sri-lanka'] },
  { id: 'afghanistan-pakistan', nom: 'Afghanistan – Pakistan (Gandhāra)', aires: ['gandhara'] },
  { id: 'cambodge', nom: 'Cambodge (art khmer)', aires: ['cambodge'] },
  { id: 'champa', nom: 'Vietnam (Champa)', aires: ['champa'] },
  { id: 'thailande-birmanie-laos', nom: 'Thaïlande, Birmanie, Laos', aires: ['birmanie-thai'] },
  { id: 'indonesie', nom: 'Indonésie (Java)', aires: ['java'] },
  { id: 'himalaya', nom: 'Népal, Tibet, Himalaya', aires: ['himalaya'] },
];
