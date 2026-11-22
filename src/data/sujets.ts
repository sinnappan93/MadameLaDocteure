/**
 * Sujets d'entraînement proposés pour démarrer la banque de sujets.
 * Ce ne sont PAS des sujets tombés au concours : les sujets réels se trouvent dans les rapports de jury
 * (à ajouter dans la banque avec leur source).
 */

export type TypeEpreuve = 'specialite' | 'culture' | 'synthese';

export const TYPES_EPREUVE: Array<{ id: TypeEpreuve; nom: string; court: string; description: string }> = [
  { id: 'specialite', nom: 'Dissertation de spécialité', court: 'Spécialité', description: 'Archéologie et histoire de l’art de l’Inde et du monde indianisé' },
  { id: 'culture', nom: 'Culture générale', court: 'Culture générale', description: 'Dissertation sur un sujet général, souvent lié au patrimoine' },
  { id: 'synthese', nom: 'Note de synthèse', court: 'Synthèse', description: 'Synthèse d’un dossier de documents (à fournir : photos ou PDF imprimé)' },
];

export interface SujetPropose {
  id: string;
  type: TypeEpreuve;
  intitule: string;
}

export const SUJETS_PROPOSES: SujetPropose[] = [
  { id: 'sp-image-bouddha', type: 'specialite', intitule: 'L’image du Bouddha en Inde, des premières représentations à l’époque gupta.' },
  { id: 'sp-temple-cosmos', type: 'specialite', intitule: 'Le temple hindou, image du cosmos ?' },
  { id: 'sp-cour-moghole', type: 'specialite', intitule: 'Art de cour et art religieux dans l’Inde moghole.' },
  { id: 'sp-circulation', type: 'specialite', intitule: 'La circulation des modèles artistiques entre l’Inde et l’Asie du Sud-Est (Ve–XIIIe siècle).' },
  { id: 'sp-bronze-sud', type: 'specialite', intitule: 'Le bronze dans l’art de l’Inde du Sud.' },
  { id: 'sp-angkor', type: 'specialite', intitule: 'Angkor, capitale et image du monde.' },
  { id: 'sp-recit', type: 'specialite', intitule: 'Le récit en images dans l’art bouddhique ancien.' },
  { id: 'sp-corps-divin', type: 'specialite', intitule: 'Le corps divin dans la sculpture indienne.' },
  { id: 'sp-rupestre', type: 'specialite', intitule: 'Les grands sites rupestres de l’Inde (IIe siècle av. J.-C. – Xe siècle).' },
  { id: 'sp-gandhara', type: 'specialite', intitule: 'L’art du Gandhāra : un art « gréco-bouddhique » ?' },
  { id: 'sp-portrait-royal', type: 'specialite', intitule: 'Le portrait royal dans l’Inde et le monde indianisé.' },
  { id: 'sp-champa', type: 'specialite', intitule: 'Art et pouvoir au Champa.' },
  { id: 'sp-java', type: 'specialite', intitule: 'Java, terre de rencontre des religions (VIIIe–XVe siècle).' },
  { id: 'sp-collections', type: 'specialite', intitule: 'Les collections d’art de l’Inde et de l’Asie du Sud-Est dans les musées français : histoire et enjeux.' },
  { id: 'sp-restaurer', type: 'specialite', intitule: 'Restaurer les monuments du monde indianisé : méthodes et débats, de l’anastylose à aujourd’hui.' },
  { id: 'cg-conserver', type: 'culture', intitule: 'Faut-il tout conserver ?' },
  { id: 'cg-bien-commun', type: 'culture', intitule: 'Le patrimoine appartient-il à tous ?' },
  { id: 'cg-restituer', type: 'culture', intitule: 'Restituer.' },
  { id: 'cg-musee', type: 'culture', intitule: 'Le musée, lieu de mémoire ou lieu de vie ?' },
  { id: 'cg-authenticite', type: 'culture', intitule: 'L’authenticité.' },
  { id: 'cg-copier', type: 'culture', intitule: 'Copier.' },
  { id: 'cg-ruine', type: 'culture', intitule: 'La ruine.' },
  { id: 'cg-transmettre', type: 'culture', intitule: 'Transmettre.' },
  { id: 'cg-public', type: 'culture', intitule: 'Le public.' },
  { id: 'cg-detruire', type: 'culture', intitule: 'Détruire.' },
  { id: 'cg-frontieres', type: 'culture', intitule: 'Les frontières.' },
  { id: 'sy-dossier', type: 'synthese', intitule: 'Note de synthèse sur ton propre dossier de documents (à photographier ou à garder sous les yeux).' },
];
