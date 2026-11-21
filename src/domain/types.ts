/** Modèle de données de MadameLaDocteure. Logique pure : aucune dépendance à React ni au stockage. */

/** Provenance d'une image : recherche sur le net (Wikimedia Commons), adresse collée, ou photo personnelle. */
export type ImageSource = 'commons' | 'url' | 'photo';

/** Une image rattachée à une œuvre. Le fichier lui-même est stocké à part (table `fichiers`), pour un usage hors ligne. */
export interface ImageOeuvre {
  id: string;
  oeuvreId: string;
  source: ImageSource;
  /** Identifiant du fichier (Blob) dans la table `fichiers`. */
  fichierId: string;
  largeur?: number;
  hauteur?: number;
  /** Crédits, obligatoires pour les images du net : auteur, licence, page d'origine. */
  titre?: string;
  auteur?: string;
  licence?: string;
  urlOrigine?: string;
  ajouteeLe: string;
}

export interface Oeuvre {
  id: string;
  titre: string;
  /** Datation libre, telle qu'on la récite : « IIe s. apr. J.-C. », « vers 1190 ». */
  datation: string;
  /** Bornes numériques (années, négatives avant J.-C.) pour trier et placer sur la frise. */
  debut?: number;
  fin?: number;
  periodeId?: string;
  aireId?: string;
  site: string;
  materiau: string;
  /** Lieu de conservation : « Musée Guimet, Paris (MA 1234) », « in situ ». */
  conservation: string;
  iconographie: string;
  style: string;
  notes: string;
  bibliographie: string;
  etiquettes: string[];
  /** Fiche préparée et livrée avec l'application (à vérifier), par opposition à une fiche créée à la main. */
  reference?: boolean;
  /** Mots-clés (souvent en anglais) pour chercher des images sur le net. */
  requeteImage?: string;
  /** Image affichée en premier. */
  imagePrincipaleId?: string;
  creeeLe: string;
  modifieeLe: string;
}

export type NouvelleOeuvre = Omit<Oeuvre, 'id' | 'creeeLe' | 'modifieeLe'>;

export function oeuvreVide(): NouvelleOeuvre {
  return {
    titre: '',
    datation: '',
    site: '',
    materiau: '',
    conservation: '',
    iconographie: '',
    style: '',
    notes: '',
    bibliographie: '',
    etiquettes: [],
  };
}
