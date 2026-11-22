/**
 * Simulateur d'oral : thèmes d'exposé et questions du jury hors thème (motivation, mise en situation professionnelle).
 * Ces questions servent quand l'IA n'est pas activée ; ce sont des questions d'entraînement, pas des questions posées au concours.
 */

export interface ThemeOral {
  id: string;
  intitule: string;
  /** Mots recherchés dans les fiches pour joindre des œuvres au thème. */
  motsCles: string[];
}

export const THEMES_ORAL: ThemeOral[] = [
  { id: 'th-stupa', intitule: 'Le stūpa et son décor', motsCles: ['stupa', 'stūpa', 'sanchi', 'bharhut', 'amaravati', 'borobudur', 'toraṇa', 'torana'] },
  { id: 'th-bouddha', intitule: 'La naissance de l’image du Bouddha', motsCles: ['bouddha', 'mathura', 'gandhara', 'gandhāra', 'sarnath', 'sārnāth'] },
  { id: 'th-vishnu', intitule: 'Les images de Viṣṇu, de l’Inde au Cambodge', motsCles: ['vishnu', 'viṣṇu', 'avatar', 'harihara', 'krishna', 'kṛṣṇa'] },
  { id: 'th-shiva', intitule: 'Śiva et ses formes', motsCles: ['shiva', 'śiva', 'nataraja', 'naṭarāja', 'linga', 'liṅga', 'elephanta'] },
  { id: 'th-bronze', intitule: 'Le bronze dans l’art de l’Inde du Sud', motsCles: ['bronze', 'chola', 'cōḻa', 'cire perdue', 'alliage'] },
  { id: 'th-rupestre', intitule: 'Sanctuaires rupestres', motsCles: ['rupestre', 'ajanta', 'ellora', 'elephanta', 'grotte', 'mamallapuram'] },
  { id: 'th-temple', intitule: 'Le temple hindou : architecture et décor', motsCles: ['temple', 'khajuraho', 'śikhara', 'shikhara', 'gopura', 'thanjavur', 'konarak'] },
  { id: 'th-angkor', intitule: 'Angkor et l’art khmer', motsCles: ['angkor', 'khmer', 'bayon', 'jayavarman', 'banteay', 'baphuon'] },
  { id: 'th-champa', intitule: 'L’art du Champa', motsCles: ['champa', 'cham', 'mỹ sơn', 'my son', 'dong duong', 'trà kiệu'] },
  { id: 'th-java', intitule: 'Java : Borobudur et Prambanan', motsCles: ['java', 'borobudur', 'prambanan', 'sailendra', 'majapahit'] },
  { id: 'th-peinture', intitule: 'La peinture indienne, des fresques aux miniatures', motsCles: ['peinture', 'miniature', 'ajanta', 'moghol', 'rajput', 'pahari', 'gouache'] },
  { id: 'th-moghol', intitule: 'L’art de cour moghol', motsCles: ['moghol', 'akbar', 'shah jahan', 'jahangir', 'taj', 'fatehpur'] },
  { id: 'th-feminin', intitule: 'Figures féminines et divinités protectrices', motsCles: ['yakshi', 'yakṣī', 'devi', 'devī', 'durga', 'durgā', 'apsara', 'tara', 'tārā'] },
  { id: 'th-musee', intitule: 'Exposer l’art de l’Inde et de l’Asie du Sud-Est en France', motsCles: ['guimet', 'louvre', 'quai branly', 'cernuschi', 'mnaag'] },
];

export interface QuestionBanque {
  question: string;
  /** Pistes de réponse attendues par le jury, montrées après la réponse. */
  attendu: string;
}

export const QUESTIONS_MOTIVATION: QuestionBanque[] = [
  {
    question: 'Pourquoi voulez-vous devenir conservatrice du patrimoine ?',
    attendu: 'Un projet personnel et précis (pas seulement l’amour de l’art) : missions concrètes (étudier, conserver, enrichir, transmettre), service public, travail en équipe.',
  },
  {
    question: 'Pourquoi la spécialité archéologie et l’option Inde et monde indianisé ? Où vous voyez-vous exercer ?',
    attendu: 'Cohérence du parcours ; institutions concernées (MNAAG-Guimet, Louvre, Quai Branly, musées en région, services archéologiques, EFEO) ; ouverture au-delà de l’option.',
  },
  {
    question: 'Présentez votre parcours en deux minutes : qu’est-ce qui vous prépare au métier ?',
    attendu: 'Un récit construit et bref, des expériences concrètes (stages, fouilles, inventaire, médiation), les compétences acquises plutôt qu’une liste de diplômes.',
  },
  {
    question: 'Un conservateur est aussi un manager. Avez-vous déjà encadré ou coordonné une équipe ? Comment vous y prendriez-vous ?',
    attendu: 'Exemples précis, même modestes ; écoute, délégation, conduite de projet, dialogue avec les métiers (régisseurs, restaurateurs, médiateurs, agents de surveillance).',
  },
  {
    question: 'Quel musée ou quelle exposition récente vous a marquée, et pourquoi ?',
    attendu: 'Un exemple réel et récent, analysé en professionnelle : parti pris scientifique, scénographie, publics, médiation, catalogue.',
  },
  {
    question: 'Quelles sont selon vous les grandes évolutions du métier de conservateur aujourd’hui ?',
    attendu: 'Numérique et données ouvertes, recherche de provenance et restitutions, publics et accessibilité, transition écologique, ressources propres et mécénat.',
  },
];

export const QUESTIONS_SITUATION: QuestionBanque[] = [
  {
    question: 'Un grand musée étranger demande le prêt d’une sculpture en grès de vos collections pour une exposition de six mois. Que faites-vous ?',
    attendu: 'État de conservation et avis du restaurateur, constat d’état, conditions climatiques et de sécurité (facility report), convoiement, assurance ou garantie d’État, durée, avis de la commission, intérêt scientifique, réciprocité.',
  },
  {
    question: 'À votre arrivée, vous découvrez que le récolement décennal de votre département n’a jamais été terminé. Comment vous organisez-vous ?',
    attendu: 'Obligation légale (code du patrimoine), plan de récolement, priorités, équipe et outils (base de données), traitement des manques (plainte, inscription), lien avec l’inventaire et les dépôts.',
  },
  {
    question: 'Un marchand vous propose un bronze chola à un prix attractif, avec un historique de propriété incomplet. Que faites-vous ?',
    attendu: 'Vérification de la provenance (dates d’exportation, bases de données d’objets volés, Interpol, archives), Convention UNESCO de 1970, déontologie (code de l’ICOM), commission d’acquisition, refus en cas de doute sérieux.',
  },
  {
    question: 'Une œuvre exposée présente des soulèvements de polychromie. Que faites-vous dans les jours qui suivent ?',
    attendu: 'Mise en sécurité (retrait, conditions climatiques), diagnostic par un restaurateur habilité, cahier des charges, commission scientifique de restauration, documentation, budget, information du public.',
  },
  {
    question: 'Le gouvernement d’un pays d’Asie demande la restitution d’une œuvre de vos collections. Comment réagissez-vous ?',
    attendu: 'Inaliénabilité des collections publiques, recherche de provenance, dialogue avec le ministère, procédures de sortie des collections (loi d’espèce ou cadre général, à vérifier selon l’état du droit), coopération scientifique, transparence.',
  },
  {
    question: 'On vous confie la refonte des salles d’Asie du Sud-Est de votre musée. Par quoi commencez-vous ?',
    attendu: 'Projet scientifique et culturel, étude des publics, parti pris de présentation (chronologique, géographique, thématique), conservation préventive, médiation, accessibilité, calendrier et budget, équipe projet.',
  },
  {
    question: 'Vous devez monter une exposition avec un budget réduit de moitié. Comment faites-vous ?',
    attendu: 'Priorités scientifiques, collections propres plutôt que prêts lointains, partenariats et coproductions, mécénat, itinérance, catalogue numérique, arbitrages assumés.',
  },
  {
    question: 'Une fouille préventive livre un dépôt de sculptures. Quel est le rôle du conservateur ?',
    attendu: 'Cadre de l’archéologie préventive (DRAC/SRA, opérateurs), statut du mobilier, conservation d’urgence, étude, dépôt (centre de conservation et d’étude), valorisation, lien avec le musée.',
  },
  {
    question: 'Un dégât des eaux touche vos réserves un dimanche. Quelles sont vos premières décisions ?',
    attendu: 'Plan de sauvegarde des biens culturels, sécurité des personnes, chaîne d’alerte, priorités d’évacuation, séchage et stabilisation, documentation des dommages, retour d’expérience.',
  },
  {
    question: 'Comment faire venir au musée un public qui ne connaît rien à l’art de l’Inde ?',
    attendu: 'Médiation adaptée (récits, gestes, matériaux), partenariats (écoles, associations, communautés), programmation culturelle, numérique, gratuité ciblée, évaluation.',
  },
  {
    question: 'Un chercheur demande à photographier et publier une œuvre de vos réserves. Que lui répondez-vous ?',
    attendu: 'Accueil des chercheurs (mission de service public), conditions d’accès aux réserves, droits sur les images et données ouvertes, mention de la source, intérêt pour la connaissance de la collection.',
  },
  {
    question: 'Votre musée souhaite numériser et mettre en ligne toutes ses collections asiatiques. Quels sont les enjeux ?',
    attendu: 'Qualité des notices (récolement, vérification des attributions), droits, formats ouverts, accessibilité, coût et priorités, provenance visible, interopérabilité (bases nationales).',
  },
];
