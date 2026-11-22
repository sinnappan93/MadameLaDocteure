/**
 * Glossaire iconographique et architectural de l'option Inde et monde indianisé.
 * Définitions de base, à compléter avec les manuels ; `exemples` renvoie aux fiches préparées où l'on voit le terme.
 */

export type CategorieGlossaire = 'gestes' | 'postures' | 'attributs' | 'divinites' | 'montures' | 'architecture' | 'notions';

export const CATEGORIES_GLOSSAIRE: Array<{ id: CategorieGlossaire; nom: string }> = [
  { id: 'gestes', nom: 'Gestes (mudrā)' },
  { id: 'postures', nom: 'Postures et signes du Bouddha' },
  { id: 'attributs', nom: 'Attributs' },
  { id: 'divinites', nom: 'Divinités et figures' },
  { id: 'montures', nom: 'Montures (vāhana)' },
  { id: 'architecture', nom: 'Architecture' },
  { id: 'notions', nom: 'Notions et techniques' },
];

export interface Terme {
  /** Identifiant stable, préfixé « gl- ». */
  id: string;
  terme: string;
  categorie: CategorieGlossaire | `en-${string}`;
  definition: string;
  /** Fiches préparées où l'on peut observer le terme. */
  exemples?: string[];
}

export const GLOSSAIRE: Terme[] = [
  // ——— Gestes ———
  { id: 'gl-abhaya', terme: 'abhaya-mudrā', categorie: 'gestes', definition: 'Main droite levée, paume tournée vers l’avant, doigts vers le haut : geste d’absence de crainte et de protection.', exemples: ['ref-bouddha-katra', 'ref-bouddha-marchant-sukhothai'] },
  { id: 'gl-varada', terme: 'varada-mudrā', categorie: 'gestes', definition: 'Main abaissée, paume tournée vers l’avant, doigts vers le bas : geste du don, qui exauce les vœux.' },
  { id: 'gl-dhyana', terme: 'dhyāna-mudrā', categorie: 'gestes', definition: 'Mains posées dans le giron, l’une sur l’autre, paumes vers le haut : geste de la méditation.', exemples: ['ref-gal-vihara'] },
  { id: 'gl-bhumisparsha', terme: 'bhūmisparśa-mudrā', categorie: 'gestes', definition: 'Main droite pendante, doigts touchant le sol devant le genou : le Bouddha prend la Terre à témoin de ses mérites face à Māra, juste avant l’Éveil à Bodh-Gayā.' },
  { id: 'gl-dharmacakra-mudra', terme: 'dharmacakra-mudrā', categorie: 'gestes', definition: 'Les deux mains devant la poitrine, pouces et index formant des cercles : mise en mouvement de la roue de la Loi, premier sermon à Sarnath.', exemples: ['ref-bouddha-sarnath', 'ref-prajnaparamita-singasari'] },
  { id: 'gl-vitarka', terme: 'vitarka-mudrā', categorie: 'gestes', definition: 'Main levée, pouce et index joints en cercle, autres doigts tendus : geste de l’argumentation et de l’enseignement.' },
  { id: 'gl-anjali', terme: 'añjali-mudrā', categorie: 'gestes', definition: 'Mains jointes, paume contre paume, devant la poitrine : geste de salut et d’adoration, typique des fidèles et des donateurs.' },
  { id: 'gl-gaja-hasta', terme: 'gaja-hasta', categorie: 'gestes', definition: 'Bras tendu en travers du corps, main pendante comme une trompe d’éléphant ; chez Śiva Naṭarāja, il désigne le pied levé, promesse de délivrance.', exemples: ['ref-nataraja-chola'] },
  { id: 'gl-tarjani', terme: 'tarjanī-mudrā', categorie: 'gestes', definition: 'Index pointé, parfois levé : geste de menace ou d’avertissement, porté par des gardiens et des divinités terribles.' },

  // ——— Postures et signes du Bouddha ———
  { id: 'gl-padmasana', terme: 'padmāsana (vajraparyaṅka)', categorie: 'postures', definition: 'Assis jambes croisées, les plantes des pieds tournées vers le haut : posture de méditation du Bouddha et des divinités en yoga.', exemples: ['ref-bouddha-sarnath'] },
  { id: 'gl-lalitasana', terme: 'lalitāsana', categorie: 'postures', definition: 'Assis, une jambe repliée sur le siège, l’autre pendante : posture de détente des bodhisattva et des divinités bienveillantes.' },
  { id: 'gl-maharajalila', terme: 'mahārājalīlāsana', categorie: 'postures', definition: '« Aisance royale » : une jambe repliée à plat, l’autre genou relevé, le bras posé dessus avec nonchalance.' },
  { id: 'gl-bhadrasana', terme: 'bhadrāsana', categorie: 'postures', definition: 'Assis jambes pendantes, « à l’européenne » : posture fréquente pour Maitreya et pour certains Bouddhas de Dvāravatī.' },
  { id: 'gl-tribhanga', terme: 'tribhaṅga', categorie: 'postures', definition: '« Triple flexion » : corps infléchi au cou, à la taille et aux genoux, qui donne grâce et mouvement ; sculpture gupta, peinture d’Ajanta, bronzes chola.', exemples: ['ref-ajanta-padmapani'] },
  { id: 'gl-samabhanga', terme: 'samabhaṅga', categorie: 'postures', definition: 'Station debout droite et frontale, le poids réparti sur les deux jambes, sans déhanchement.' },
  { id: 'gl-kayotsarga', terme: 'kāyotsarga', categorie: 'postures', definition: 'Posture jaïne : debout, raide, bras le long du corps sans le toucher ; c’est l’ascèse immobile des Jina (tīrthaṅkara).' },
  { id: 'gl-parinirvana', terme: 'parinirvāṇa', categorie: 'postures', definition: 'Bouddha couché sur le côté droit, la tête soutenue par la main : son extinction définitive (sa mort) à Kuśinagara. À ne pas confondre avec Viṣṇu couché (Anantaśayana).', exemples: ['ref-gal-vihara'] },
  { id: 'gl-lakshana', terme: 'lakṣaṇa', categorie: 'postures', definition: 'Les 32 marques majeures du « grand homme » (mahāpuruṣa) qui distinguent le corps du Bouddha : protubérance crânienne, touffe entre les sourcils, roues sur les paumes et les plantes des pieds…' },
  { id: 'gl-ushnisha', terme: 'uṣṇīṣa', categorie: 'postures', definition: 'Protubérance au sommet du crâne du Bouddha, un des 32 signes : sa sagesse surnaturelle. En Asie du Sud-Est, souvent surmontée d’une flamme.', exemples: ['ref-bouddha-sarnath', 'ref-bouddha-marchant-sukhothai'] },
  { id: 'gl-urna', terme: 'ūrṇā', categorie: 'postures', definition: 'Touffe de poils entre les sourcils, figurée par un point, une perle ou une incrustation : un des signes du Bouddha.' },
  { id: 'gl-lobes', terme: 'Lobes d’oreilles allongés', categorie: 'postures', definition: 'Distendus par les lourds bijoux que portait le prince Siddhārtha avant son renoncement : rappel de sa vie princière abandonnée.' },
  { id: 'gl-mitre-cylindrique', terme: 'Mitre cylindrique', categorie: 'postures', definition: 'Haute coiffure en cylindre, typique de Viṣṇu dans la statuaire préangkorienne et khmère ; s’oppose au chignon d’ascète (jaṭāmukuṭa) de Śiva.', exemples: ['ref-harihara-maha-rosei'] },
  { id: 'gl-jatamukuta', terme: 'jaṭāmukuṭa', categorie: 'postures', definition: 'Chignon d’ascète formé de mèches tressées, souvent orné d’un croissant de lune ou d’un crâne : coiffure de Śiva et des ascètes.', exemples: ['ref-harihara-maha-rosei'] },

  // ——— Attributs ———
  { id: 'gl-vajra', terme: 'vajra', categorie: 'attributs', definition: '« Foudre-diamant » : sceptre à pointes recourbées, symbole d’indestructibilité et de puissance ; attribut d’Indra, de Vajrapāṇi et emblème du bouddhisme tantrique (Vajrayāna).' },
  { id: 'gl-ghanta', terme: 'ghaṇṭā', categorie: 'attributs', definition: 'Clochette rituelle, souvent tenue avec le vajra dans le bouddhisme tantrique : la sagesse, associée à la méthode (vajra).' },
  { id: 'gl-trishula', terme: 'triśūla', categorie: 'attributs', definition: 'Trident, arme et emblème de Śiva (et de Durgā).' },
  { id: 'gl-cakra', terme: 'cakra', categorie: 'attributs', definition: 'Disque : arme de jet de Viṣṇu, symbole de l’ordre cosmique. Dans le bouddhisme, la roue de la Loi (dharmacakra).', exemples: ['ref-chapiteau-sarnath', 'ref-dharmacakra-dvaravati'] },
  { id: 'gl-shankha', terme: 'śaṅkha', categorie: 'attributs', definition: 'Conque marine, attribut de Viṣṇu : le son primordial et la victoire.' },
  { id: 'gl-gada', terme: 'gadā', categorie: 'attributs', definition: 'Massue, attribut de Viṣṇu (souvent personnifiée en déesse) et de héros comme Bhīma ou Hanumān.' },
  { id: 'gl-padma', terme: 'padma', categorie: 'attributs', definition: 'Lotus : pureté (il naît de la boue et fleurit intact) ; attribut de Lakṣmī, de Sūrya et de Padmapāṇi ; sert aussi de socle aux divinités.', exemples: ['ref-ajanta-padmapani'] },
  { id: 'gl-kalasha', terme: 'kalaśa', categorie: 'attributs', definition: 'Vase à eau, signe d’abondance et d’immortalité ; attribut de Maitreya et de Brahmā. Désigne aussi l’élément sommital en forme de vase d’un temple.' },
  { id: 'gl-damaru', terme: 'ḍamaru', categorie: 'attributs', definition: 'Petit tambour en forme de sablier tenu par Śiva : le rythme de la création.', exemples: ['ref-nataraja-chola'] },
  { id: 'gl-akshamala', terme: 'akṣamālā', categorie: 'attributs', definition: 'Chapelet, attribut de Brahmā, de Śiva ascète, d’Avalokiteśvara et des ascètes.' },
  { id: 'gl-pasha', terme: 'pāśa', categorie: 'attributs', definition: 'Lasso ou nœud coulant qui capture : attribut de Gaṇeśa, de Yama et de Varuṇa.' },
  { id: 'gl-ankusha', terme: 'aṅkuśa', categorie: 'attributs', definition: 'Aiguillon à éléphant : attribut de Gaṇeśa et d’Indra.' },
  { id: 'gl-camara', terme: 'cāmara', categorie: 'attributs', definition: 'Chasse-mouches en crin de yak, insigne royal tenu par des serviteurs ou des divinités secondaires de part et d’autre d’une figure principale.', exemples: ['ref-yakshi-didarganj', 'ref-bouddha-katra'] },
  { id: 'gl-chattra', terme: 'chattra', categorie: 'attributs', definition: 'Parasol, insigne de royauté et de souveraineté spirituelle ; superposé au sommet des stūpa.', exemples: ['ref-sanchi'] },
  { id: 'gl-pustaka', terme: 'pustaka', categorie: 'attributs', definition: 'Livre ou manuscrit sur feuilles de palmier : attribut de Prajñāpāramitā, de Mañjuśrī et de Sarasvatī, déesse du savoir.', exemples: ['ref-prajnaparamita-singasari'] },

  // ——— Divinités et figures ———
  { id: 'gl-linga', terme: 'liṅga', categorie: 'divinites', definition: 'Emblème aniconique de Śiva, pilier cylindrique dressé sur un piédestal (pīṭha) qui recueille les eaux des ablutions ; c’est l’image principale de la plupart des temples shivaïtes.', exemples: ['ref-brihadishvara', 'ref-tra-kieu'] },
  { id: 'gl-nataraja', terme: 'Naṭarāja', categorie: 'divinites', definition: 'Śiva « roi de la danse », dansant dans un cercle de flammes sur le nain Apasmāra : les cinq activités divines (création, préservation, destruction, voilement, grâce).', exemples: ['ref-nataraja-chola'] },
  { id: 'gl-ardhanarishvara', terme: 'Ardhanārīśvara', categorie: 'divinites', definition: 'Śiva moitié homme, moitié femme (Pārvatī) : union des principes masculin et féminin.', exemples: ['ref-elephanta'] },
  { id: 'gl-somaskanda', terme: 'Somāskanda', categorie: 'divinites', definition: 'Śiva assis avec son épouse Umā et leur fils Skanda enfant : image familiale typique des temples pallava.', exemples: ['ref-kailasanatha-kanchi'] },
  { id: 'gl-harihara', terme: 'Harihara', categorie: 'divinites', definition: 'Divinité moitié Śiva (Hara), moitié Viṣṇu (Hari) : chignon d’ascète d’un côté, mitre de l’autre. Très présente au Cambodge préangkorien.', exemples: ['ref-harihara-maha-rosei'] },
  { id: 'gl-trimurti', terme: 'Trimūrti', categorie: 'divinites', definition: 'Triade Brahmā (création), Viṣṇu (préservation), Śiva (destruction). Le buste d’Elephanta, longtemps appelé « Trimūrti », est en fait un Śiva à plusieurs visages (Sadāśiva).', exemples: ['ref-elephanta', 'ref-prambanan'] },
  { id: 'gl-dashavatara', terme: 'Daśāvatāra', categorie: 'divinites', definition: 'Les dix « descentes » de Viṣṇu : Matsya (poisson), Kūrma (tortue), Varāha (sanglier), Narasiṃha (homme-lion), Vāmana (nain), Paraśurāma, Rāma, Kṛṣṇa (ou Balarāma), le Bouddha, Kalkin.', exemples: ['ref-deogarh'] },
  { id: 'gl-anantashayana', terme: 'Anantaśayana', categorie: 'divinites', definition: 'Viṣṇu couché sur le serpent Ananta (Śeṣa), dormant sur l’océan cosmique entre deux créations ; le lotus de son nombril porte Brahmā.', exemples: ['ref-deogarh', 'ref-vishnu-mebon'] },
  { id: 'gl-govardhana', terme: 'Kṛṣṇa Govardhanadhara', categorie: 'divinites', definition: 'Kṛṣṇa soulevant le mont Govardhana pour abriter les bouviers de l’orage envoyé par Indra.' },
  { id: 'gl-gajalakshmi', terme: 'Gaja-Lakṣmī', categorie: 'divinites', definition: 'Lakṣmī sur un lotus, aspergée par deux éléphants : prospérité et fertilité ; motif présent dès Bharhut et Sanchi.', exemples: ['ref-sanchi', 'ref-kailasa-ellora'] },
  { id: 'gl-ganesha', terme: 'Gaṇeśa', categorie: 'divinites', definition: 'Fils de Śiva et Pārvatī à tête d’éléphant, ventre rond, une défense brisée ; il écarte les obstacles et est invoqué en premier.' },
  { id: 'gl-skanda', terme: 'Skanda (Kārttikeya)', categorie: 'divinites', definition: 'Fils de Śiva, dieu de la guerre, jeune et souvent à six visages ; sa monture est le paon. Murugan dans le pays tamoul.' },
  { id: 'gl-durga', terme: 'Durgā Mahiṣāsuramardinī', categorie: 'divinites', definition: 'Déesse guerrière aux bras multiples tuant le démon-buffle Mahiṣa ; sa monture est le lion. Thème majeur de l’Inde au Cambodge et à Java.', exemples: ['ref-prambanan'] },
  { id: 'gl-surya', terme: 'Sūrya', categorie: 'divinites', definition: 'Dieu du Soleil, debout, tenant deux lotus, souvent chaussé de bottes (origine iranienne) ; son char est tiré par sept chevaux.', exemples: ['ref-konark'] },
  { id: 'gl-bodhisattva', terme: 'bodhisattva', categorie: 'divinites', definition: 'Être promis à l’Éveil qui y renonce temporairement pour aider les autres (Mahāyāna) ; figuré en prince paré, à la différence du Bouddha au vêtement monastique.', exemples: ['ref-bodhisattva-shahbaz-garhi', 'ref-ajanta-padmapani'] },
  { id: 'gl-avalokiteshvara', terme: 'Avalokiteśvara (Lokeśvara, Padmapāṇi)', categorie: 'divinites', definition: 'Bodhisattva de la compassion ; tient un lotus et porte dans sa coiffure une petite image du bouddha Amitābha.', exemples: ['ref-ajanta-padmapani', 'ref-autel-dong-duong', 'ref-bayon'] },
  { id: 'gl-maitreya', terme: 'Maitreya', categorie: 'divinites', definition: 'Bouddha du futur, encore bodhisattva ; tient souvent un vase (kalaśa) et porte parfois un petit stūpa dans la coiffure.' },
  { id: 'gl-manjushri', terme: 'Mañjuśrī', categorie: 'divinites', definition: 'Bodhisattva de la sagesse, tenant une épée qui tranche l’ignorance et un livre.' },
  { id: 'gl-vajrapani', terme: 'Vajrapāṇi', categorie: 'divinites', definition: 'Bodhisattva « qui tient le vajra », protecteur du Bouddha ; au Gandhāra, il est parfois représenté sous les traits d’Héraclès.' },
  { id: 'gl-prajnaparamita', terme: 'Prajñāpāramitā', categorie: 'divinites', definition: 'La perfection de sagesse personnifiée en déesse, avec le livre qui porte son nom.', exemples: ['ref-prajnaparamita-singasari', 'ref-manuscrit-pala'] },
  { id: 'gl-tara', terme: 'Tārā', categorie: 'divinites', definition: 'Déesse bouddhique salvatrice (verte, blanche…), assise, tenant un lotus ; très populaire à l’époque pāla et dans l’Himalaya.' },
  { id: 'gl-tirthankara', terme: 'tīrthaṅkara (Jina)', categorie: 'divinites', definition: 'Les 24 maîtres du jaïnisme, dont Mahāvīra est le dernier ; figurés nus et debout (kāyotsarga) ou assis en méditation, identifiés par leur emblème (lāñchana).', exemples: ['ref-kailasa-ellora'] },
  { id: 'gl-yaksha', terme: 'yakṣa / yakṣī', categorie: 'divinites', definition: 'Génies tutélaires des arbres, des eaux et de la richesse ; parmi les premières grandes sculptures indiennes, intégrés aux monuments bouddhiques.', exemples: ['ref-yakshi-didarganj', 'ref-bharhut'] },
  { id: 'gl-naga', terme: 'nāga', categorie: 'divinites', definition: 'Serpent divin (cobra à plusieurs têtes), maître des eaux souterraines. Le nāga Mucalinda abrite le Bouddha méditant de ses capuchons : thème majeur au Cambodge.', exemples: ['ref-mahabalipuram-penitence'] },
  { id: 'gl-apsaras', terme: 'apsaras', categorie: 'divinites', definition: 'Nymphes célestes, danseuses du paradis d’Indra ; omniprésentes dans le décor khmer et cham.', exemples: ['ref-tra-kieu', 'ref-angkor-vat', 'ref-sigiriya'] },
  { id: 'gl-devata', terme: 'devatā', categorie: 'divinites', definition: 'Divinité féminine debout, parée, dans une niche : décor caractéristique des temples khmers.', exemples: ['ref-banteay-srei', 'ref-angkor-vat'] },
  { id: 'gl-dvarapala', terme: 'dvārapāla', categorie: 'divinites', definition: 'Gardien de porte, souvent menaçant et armé d’une massue, placé de part et d’autre de l’entrée d’un sanctuaire.', exemples: ['ref-autel-dong-duong'] },
  { id: 'gl-kirtimukha', terme: 'kīrtimukha', categorie: 'divinites', definition: '« Visage de gloire » : masque de monstre aux yeux exorbités, sans mâchoire inférieure, placé au-dessus des portes et des niches pour les protéger ; appelé kāla à Java.' },
  { id: 'gl-makara', terme: 'makara', categorie: 'divinites', definition: 'Monstre aquatique composite (crocodile, éléphant, poisson) ; monture de la déesse Gaṅgā, il orne les extrémités des arcs et des linteaux.' },
  { id: 'gl-mithuna', terme: 'mithuna', categorie: 'divinites', definition: 'Couple amoureux sculpté, image auspicieuse de fécondité et d’union ; très présent à Khajuraho et Konark.', exemples: ['ref-kandariya', 'ref-konark'] },
  { id: 'gl-shalabhanjika', terme: 'śālabhañjikā', categorie: 'divinites', definition: 'Femme saisissant la branche d’un arbre en fleur, souvent en console : image de fertilité, comme aux portes de Sanchi.', exemples: ['ref-sanchi'] },

  // ——— Montures ———
  { id: 'gl-vahana', terme: 'vāhana', categorie: 'montures', definition: 'Monture d’une divinité, qui permet de l’identifier : Gaṇeśa le rat, Skanda le paon, Durgā le lion, Agni le bélier, Yama le buffle, Gaṅgā le makara, Yamunā la tortue.' },
  { id: 'gl-nandi', terme: 'Nandi', categorie: 'montures', definition: 'Le taureau, monture de Śiva ; il a souvent son propre pavillon face au sanctuaire.', exemples: ['ref-virupaksha-pattadakal', 'ref-kailasa-ellora'] },
  { id: 'gl-garuda', terme: 'Garuḍa', categorie: 'montures', definition: 'Être mi-homme mi-oiseau, monture de Viṣṇu et ennemi des nāga ; emblème royal en Asie du Sud-Est.', exemples: ['ref-hampi-vitthala'] },
  { id: 'gl-hamsa', terme: 'haṃsa', categorie: 'montures', definition: 'L’oie sauvage, monture de Brahmā (et de Sarasvatī).', exemples: ['ref-prambanan'] },
  { id: 'gl-airavata', terme: 'Airāvata', categorie: 'montures', definition: 'L’éléphant blanc, souvent à trois têtes en Asie du Sud-Est, monture d’Indra, roi des dieux.' },

  // ——— Architecture ———
  { id: 'gl-stupa', terme: 'stūpa', categorie: 'architecture', definition: 'Monument plein, en dôme, abritant des reliques ; on en fait le tour. Dôme (aṇḍa), enclos sommital (harmikā), parasols (chattra), balustrade (vedikā).', exemples: ['ref-sanchi', 'ref-borobudur'] },
  { id: 'gl-anda', terme: 'aṇḍa', categorie: 'architecture', definition: '« Œuf » : le dôme hémisphérique du stūpa.', exemples: ['ref-sanchi'] },
  { id: 'gl-harmika', terme: 'harmikā', categorie: 'architecture', definition: 'Petit enclos carré au sommet du stūpa, d’où s’élève le mât portant les parasols.', exemples: ['ref-sanchi'] },
  { id: 'gl-vedika', terme: 'vedikā', categorie: 'architecture', definition: 'Balustrade de pierre qui entoure le stūpa en imitant une barrière de bois (piliers, traverses, couronnement), souvent sculptée.', exemples: ['ref-bharhut', 'ref-sanchi'] },
  { id: 'gl-torana', terme: 'toraṇa', categorie: 'architecture', definition: 'Porte monumentale faite de piliers et d’architraves superposées, couverte de reliefs, donnant accès à l’enceinte d’un stūpa ou d’un temple.', exemples: ['ref-sanchi', 'ref-bharhut'] },
  { id: 'gl-pradakshina', terme: 'pradakṣiṇā', categorie: 'architecture', definition: 'Rite qui consiste à tourner autour d’un objet sacré en le gardant à sa droite (sens des aiguilles d’une montre) ; le chemin aménagé est le pradakṣiṇāpatha (déambulatoire).', exemples: ['ref-sanchi', 'ref-borobudur'] },
  { id: 'gl-caitya', terme: 'caitya', categorie: 'architecture', definition: 'Sanctuaire bouddhique ; désigne en particulier la salle rupestre absidale à voûte en berceau, avec un stūpa au fond (Ajanta, grottes 19 et 26).' },
  { id: 'gl-gavaksha', terme: 'gavākṣa', categorie: 'architecture', definition: 'Motif d’arc en fer à cheval dérivé de la façade des caitya, répété en décor sur les temples (lucarnes, tours).' },
  { id: 'gl-vihara', terme: 'vihāra', categorie: 'architecture', definition: 'Monastère bouddhique : cellules de moines disposées autour d’une cour ou d’une salle.', exemples: ['ref-paharpur', 'ref-ajanta-padmapani'] },
  { id: 'gl-garbhagriha', terme: 'garbhagṛha', categorie: 'architecture', definition: '« Chambre-matrice » : la cella, petite pièce sombre au cœur du temple qui abrite l’image principale.', exemples: ['ref-brihadishvara', 'ref-kandariya'] },
  { id: 'gl-mandapa', terme: 'maṇḍapa', categorie: 'architecture', definition: 'Salle à piliers précédant le sanctuaire, où se réunissent les fidèles ; à Mahabalipuram, désigne aussi des salles creusées dans la roche.', exemples: ['ref-kandariya', 'ref-virupaksha-pattadakal'] },
  { id: 'gl-shikhara', terme: 'śikhara', categorie: 'architecture', definition: 'Dans le Nord, tour curviligne qui surmonte le sanctuaire (style nāgara), couronnée d’un āmalaka. Dans le vocabulaire du Sud, désigne seulement le couronnement du vimāna.', exemples: ['ref-kandariya', 'ref-patan-durbar'] },
  { id: 'gl-amalaka', terme: 'āmalaka', categorie: 'architecture', definition: 'Grand disque côtelé (en forme du fruit āmalaka) qui couronne la tour d’un temple nāgara.', exemples: ['ref-kandariya'] },
  { id: 'gl-vimana', terme: 'vimāna', categorie: 'architecture', definition: 'Dans le Sud, le sanctuaire et sa tour pyramidale à étages, ornée de pavillons miniatures (style drāviḍa).', exemples: ['ref-brihadishvara', 'ref-kailasanatha-kanchi'] },
  { id: 'gl-gopura', terme: 'gopura', categorie: 'architecture', definition: 'Pavillon d’entrée monumental à tour, percé dans l’enceinte d’un temple ; dans le Sud, il devient plus haut que le sanctuaire à partir des XIIe–XIIIe s. Le terme sert aussi pour les entrées des temples khmers.', exemples: ['ref-hampi-vitthala', 'ref-virupaksha-pattadakal'] },
  { id: 'gl-nagara', terme: 'nāgara', categorie: 'architecture', definition: 'Style de temple du Nord de l’Inde : tour curviligne (śikhara) couronnée d’un āmalaka, plan à redans.', exemples: ['ref-kandariya', 'ref-konark'] },
  { id: 'gl-dravida', terme: 'drāviḍa', categorie: 'architecture', definition: 'Style de temple du Sud de l’Inde : vimāna pyramidal à étages couronné d’un dôme, enceintes et gopura.', exemples: ['ref-brihadishvara', 'ref-kailasanatha-kanchi'] },
  { id: 'gl-jagati', terme: 'jagatī', categorie: 'architecture', definition: 'Haute plate-forme ou soubassement sur lequel est bâti le temple.', exemples: ['ref-deogarh', 'ref-belur'] },
  { id: 'gl-meru', terme: 'mont Meru', categorie: 'architecture', definition: 'Montagne cosmique au centre de l’univers, demeure des dieux ; les tours des temples et les temples-montagnes la figurent.', exemples: ['ref-angkor-vat', 'ref-kandariya'] },
  { id: 'gl-temple-montagne', terme: 'temple-montagne', categorie: 'architecture', definition: 'Temple khmer pyramidal à terrasses, couronné de tours, figurant le mont Meru ; temple d’État d’un roi (Bakong, Angkor Vat, Bayon).', exemples: ['ref-angkor-vat', 'ref-bayon'] },
  { id: 'gl-prasat', terme: 'prasat', categorie: 'architecture', definition: 'Tour-sanctuaire khmère abritant une image divine ; désigne aussi un temple entier.', exemples: ['ref-angkor-vat', 'ref-bayon'] },
  { id: 'gl-kalan', terme: 'kalan', categorie: 'architecture', definition: 'Tour-sanctuaire cham en brique, à étages décroissants, ouverte à l’est.', exemples: ['ref-my-son'] },
  { id: 'gl-candi', terme: 'candi', categorie: 'architecture', definition: 'En Indonésie, nom donné aux temples anciens, hindous ou bouddhiques (Candi Prambanan, Candi Sewu).', exemples: ['ref-prambanan', 'ref-borobudur'] },
  { id: 'gl-baray', terme: 'baray', categorie: 'architecture', definition: 'Immense réservoir rectangulaire creusé par les rois d’Angkor, à la fois ouvrage hydraulique et image de l’océan cosmique.', exemples: ['ref-vishnu-mebon'] },
  { id: 'gl-ratha', terme: 'ratha', categorie: 'architecture', definition: '« Char » : à Mahabalipuram, petits temples monolithes taillés dans des blocs de granit ; à Konark et Hampi, temple ou sanctuaire en forme de char.', exemples: ['ref-konark', 'ref-hampi-vitthala'] },

  // ——— Notions et techniques ———
  { id: 'gl-jataka', terme: 'jātaka', categorie: 'notions', definition: 'Récits des vies antérieures du Bouddha, sous forme humaine ou animale ; source majeure des reliefs narratifs.', exemples: ['ref-bharhut', 'ref-sanchi', 'ref-ananda-pagan'] },
  { id: 'gl-aniconisme', terme: 'aniconisme', categorie: 'notions', definition: 'Le fait de ne pas représenter la figure du Bouddha mais de la suggérer par des symboles (trône vide, arbre, empreintes de pieds, roue, stūpa) ; lecture discutée (S. Huntington).', exemples: ['ref-bharhut', 'ref-dharmacakra-dvaravati'] },
  { id: 'gl-darshana', terme: 'darśana', categorie: 'notions', definition: '« Vision » : le fidèle voit la divinité et est vu par elle ; d’où l’importance des yeux et de la frontalité des images de culte.' },
  { id: 'gl-anastylose', terme: 'anastylose', categorie: 'notions', definition: 'Méthode de restauration qui démonte un monument puis le remonte avec ses pierres d’origine, en n’ajoutant que le minimum de matériaux neufs, identifiables.', exemples: ['ref-banteay-srei', 'ref-borobudur'] },
  { id: 'gl-cire-perdue', terme: 'fonte à la cire perdue', categorie: 'notions', definition: 'On modèle l’œuvre en cire, on l’enrobe d’argile, on fait fondre la cire et on coule le métal à sa place : chaque moule ne sert qu’une fois.', exemples: ['ref-nataraja-chola', 'ref-vishnu-mebon'] },
  { id: 'gl-ronde-bosse', terme: 'ronde-bosse', categorie: 'notions', definition: 'Sculpture dégagée de tous côtés, qu’on peut voir sous tous les angles, par opposition au relief.', exemples: ['ref-harihara-maha-rosei'] },
  { id: 'gl-arc-soutien', terme: 'arc de soutien', categorie: 'notions', definition: 'Arc de pierre reliant la tête et les bras d’une statue en grès pour la consolider, typique de la statuaire préangkorienne.', exemples: ['ref-harihara-maha-rosei'] },
  { id: 'gl-mahayana', terme: 'Mahāyāna', categorie: 'notions', definition: '« Grand Véhicule » : courant du bouddhisme centré sur l’idéal du bodhisattva et le culte de nombreux bouddhas et bodhisattva.', exemples: ['ref-autel-dong-duong', 'ref-jayavarman-vii'] },
  { id: 'gl-theravada', terme: 'Theravāda', categorie: 'notions', definition: '« Doctrine des anciens » : bouddhisme du canon pali, majoritaire à Sri Lanka, en Birmanie, en Thaïlande, au Laos et au Cambodge aujourd’hui.', exemples: ['ref-gal-vihara', 'ref-bouddha-marchant-sukhothai'] },
  { id: 'gl-vajrayana', terme: 'Vajrayāna', categorie: 'notions', definition: '« Véhicule de diamant » : bouddhisme tantrique, aux rituels et aux divinités nombreuses ; essor à l’époque pāla, au Népal, au Tibet et à Java.', exemples: ['ref-prajnaparamita-singasari'] },
  { id: 'gl-bhakti', terme: 'bhakti', categorie: 'notions', definition: 'Dévotion amoureuse et personnelle envers une divinité (Kṛṣṇa, Śiva…), qui inspire poésie, temples et peinture.', exemples: ['ref-gita-govinda-kangra'] },
];
