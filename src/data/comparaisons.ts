/**
 * Comparaisons d'œuvres deux à deux : les critères qui permettent de les distinguer.
 * `a` et `b` sont des identifiants de fiches préparées.
 */

export interface Critere {
  critere: string;
  a: string;
  b: string;
}

export interface Comparaison {
  /** Identifiant stable, préfixé « cmp- ». */
  id: string;
  titre: string;
  a: string;
  b: string;
  criteres: Critere[];
  aRetenir: string;
}

export const COMPARAISONS: Comparaison[] = [
  {
    id: 'cmp-gandhara-mathura',
    titre: 'Gandhāra ou Mathurā ?',
    a: 'ref-bodhisattva-shahbaz-garhi',
    b: 'ref-bouddha-katra',
    criteres: [
      { critere: 'Matériau', a: 'Schiste gris', b: 'Grès rouge tacheté (Sikri)' },
      { critere: 'Drapé', a: 'Plis profonds et lourds, à l’antique', b: 'Étoffe fine et collante, plis légers ; une épaule nue' },
      { critere: 'Corps et visage', a: 'Visage ovale classique, nez droit, musculature ; héritage hellénistique', b: 'Visage rond et souriant, yeux grands ouverts, corps puissant hérité des yakṣa' },
      { critere: 'Coiffure', a: 'Cheveux ondulés, turban ou chignon orné (bodhisattva princier)', b: 'Chignon en spirale (type « kapardin »)' },
      { critere: 'Contexte', a: 'Monastères du Nord-Ouest, échanges avec le monde gréco-romain', b: 'Grand centre religieux indien (bouddhisme, jaïnisme, cultes brahmaniques)' },
    ],
    aRetenir: 'Deux écoles contemporaines de l’empire kushān, au cœur du débat sur l’origine de l’image du Bouddha (Foucher contre Coomaraswamy). Attention : on compare ici un bodhisattva princier et un Bouddha.',
  },
  {
    id: 'cmp-sarnath-jamalpur',
    titre: 'Sarnath ou Mathurā à l’époque gupta ?',
    a: 'ref-bouddha-sarnath',
    b: 'ref-bouddha-mathura-gupta',
    criteres: [
      { critere: 'Matériau', a: 'Grès beige de Chunar', b: 'Grès rouge tacheté' },
      { critere: 'Robe', a: 'Lisse, « mouillée », sans plis visibles', b: 'Plis en cordelettes réguliers, en U' },
      { critere: 'Attitude', a: 'Assis, mains en dharmacakra-mudrā (premier sermon)', b: 'Debout, frontal' },
      { critere: 'Nimbe', a: 'Rinceaux et deux êtres célestes volants', b: 'Très richement sculpté : lotus, rinceaux, perles' },
    ],
    aRetenir: 'Deux variantes régionales du même idéal classique gupta, au Ve s. : savoir les distinguer d’un coup d’œil grâce au drapé.',
  },
  {
    id: 'cmp-angkorvat-bayon',
    titre: 'Angkor Vat ou Bayon ?',
    a: 'ref-angkor-vat',
    b: 'ref-bayon',
    criteres: [
      { critere: 'Roi et date', a: 'Sūryavarman II, première moitié du XIIe s.', b: 'Jayavarman VII, fin XIIe – début XIIIe s.' },
      { critere: 'Religion', a: 'Vishnouisme', b: 'Bouddhisme Mahāyāna' },
      { critere: 'Plan', a: 'Temple-montagne à cinq tours en quinconce, enceintes, larges douves', b: 'Temple-montagne compact au centre d’Angkor Thom, foule de tours' },
      { critere: 'Orientation', a: 'Ouest', b: 'Est' },
      { critere: 'Décor typique', a: 'Devatā, bas-reliefs épiques (barattage, Kurukṣetra, Laṅkā)', b: 'Tours à visages, bas-reliefs de la vie quotidienne et des guerres contre les Chams' },
      { critere: 'Style', a: 'Équilibre et symétrie « classiques »', b: 'Style du Bayon : sourire intérieur, accumulation, chantier rapide' },
    ],
    aRetenir: 'Les deux sommets de l’art angkorien, à deux générations d’écart : passage d’un temple d’État vishnouite à un programme bouddhique.',
  },
  {
    id: 'cmp-nagara-dravida',
    titre: 'Nāgara ou drāviḍa ?',
    a: 'ref-kandariya',
    b: 'ref-brihadishvara',
    criteres: [
      { critere: 'Tour', a: 'Śikhara curviligne, tours secondaires accolées', b: 'Vimāna pyramidal à étages, aux lignes droites' },
      { critere: 'Couronnement', a: 'Āmalaka (disque côtelé) et vase', b: 'Dôme couronnant le vimāna (le « śikhara » du Sud)' },
      { critere: 'Ensemble', a: 'Temple sur haute plate-forme, salles en enfilade, pas d’enceinte monumentale', b: 'Grande enceinte, gopura d’entrée, pavillon de Nandi' },
      { critere: 'Décor', a: 'Bandeaux couverts de figures sculptées', b: 'Décor plus architectural : pilastres, niches, pavillons miniatures' },
      { critere: 'Autres exemples', a: 'Konark, Bhubaneswar', b: 'Kanchipuram, Pattadakal (Virūpākṣa)' },
    ],
    aRetenir: 'Les deux grands « styles » de temple hindou ; Pattadakal les juxtapose sur un même site.',
  },
  {
    id: 'cmp-kanchi-pattadakal',
    titre: 'Le modèle et sa reprise',
    a: 'ref-kailasanatha-kanchi',
    b: 'ref-virupaksha-pattadakal',
    criteres: [
      { critere: 'Dynastie', a: 'Pallava (Narasiṃhavarman II Rājasiṃha)', b: 'Chālukya de Bādāmi (reine Lokamahādevī)' },
      { critere: 'Date', a: 'Début du VIIIe s.', b: 'Vers 740' },
      { critere: 'Rôle', a: 'Modèle : temple de la capitale pallava', b: 'Construit après la prise de Kanchipuram par Vikramāditya II' },
      { critere: 'Points communs', a: 'Vimāna à étages, enceinte, décor shivaïte', b: 'Reprend le plan drāviḍa, avec salle à piliers et pavillon de Nandi' },
    ],
    aRetenir: 'Exemple de circulation des formes (et sans doute des artisans) entre royaumes rivaux, à la suite d’une conquête.',
  },
  {
    id: 'cmp-bharhut-sanchi',
    titre: 'Bharhut ou Sanchi ?',
    a: 'ref-bharhut',
    b: 'ref-sanchi',
    criteres: [
      { critere: 'Date des reliefs', a: 'IIe s. av. J.-C.', b: 'Portes vers le Ier s. av. J.-C.' },
      { critere: 'État', a: 'Stūpa disparu, balustrade et porte remontées à Kolkata', b: 'Monument conservé en place, restauré' },
      { critere: 'Relief', a: 'Peu profond, figures frontales, scènes cadrées dans des médaillons', b: 'Plus profond, compositions foisonnantes sur les architraves, meilleur sens de l’espace' },
      { critere: 'Inscriptions', a: 'Étiquettes qui nomment les scènes', b: 'Inscriptions de donateurs (dont les ivoiriers de Vidiśā)' },
    ],
    aRetenir: 'Deux jalons de la sculpture bouddhique ancienne, tous deux aniconiques : comparer pour montrer l’évolution du relief narratif.',
  },
  {
    id: 'cmp-dongduong-trakieu',
    titre: 'Style de Đồng Dương ou de Trà Kiệu ?',
    a: 'ref-autel-dong-duong',
    b: 'ref-tra-kieu',
    criteres: [
      { critere: 'Date', a: 'Fin du IXe s.', b: 'Xe s.' },
      { critere: 'Religion', a: 'Bouddhisme Mahāyāna (monastère de Lakṣmīndralokeśvara)', b: 'Shivaïsme (piédestal de liṅga)' },
      { critere: 'Visages', a: 'Larges, lèvres épaisses, sourcils joints, expression intense', b: 'Plus doux, souriants' },
      { critere: 'Corps', a: 'Massifs, puissants, parfois menaçants (gardiens)', b: 'Souples, gracieux, en mouvement (danseuses)' },
    ],
    aRetenir: 'Deux styles successifs de l’art cham, repères de la chronologie établie par l’EFEO.',
  },
  {
    id: 'cmp-borobudur-prambanan',
    titre: 'Borobudur ou Prambanan ?',
    a: 'ref-borobudur',
    b: 'ref-prambanan',
    criteres: [
      { critere: 'Religion', a: 'Bouddhisme (dynastie Śailendra)', b: 'Shivaïsme' },
      { critere: 'Date', a: 'Vers 780–830', b: 'Vers 856' },
      { critere: 'Forme', a: 'Monument plein à terrasses, sans salle intérieure, couronné de stūpa', b: 'Ensemble de temples-tours (candi) abritant des images dans leurs cellae' },
      { critere: 'Reliefs', a: 'Vie du Bouddha, jātaka, quête de Sudhana', b: 'Rāmāyaṇa, vie de Kṛṣṇa' },
      { critere: 'Parcours', a: 'Ascension par les galeries jusqu’au sommet', b: 'Circulation entre les sanctuaires' },
    ],
    aRetenir: 'Deux chefs-d’œuvre presque contemporains, à quelques kilomètres : la coexistence du bouddhisme et de l’hindouisme à Java central.',
  },
  {
    id: 'cmp-ajanta-sigiriya',
    titre: 'Ajanta ou Sigiriya ?',
    a: 'ref-ajanta-padmapani',
    b: 'ref-sigiriya',
    criteres: [
      { critere: 'Lieu', a: 'Inde (Dekkan), monastère bouddhique rupestre', b: 'Sri Lanka, palais-forteresse royal' },
      { critere: 'Date', a: 'Fin du Ve s.', b: 'Fin du Ve s.' },
      { critere: 'Sujets', a: 'Jātaka, vie du Bouddha, bodhisattva', b: 'Figures féminines en buste, émergeant des nuages' },
      { critere: 'Fonction', a: 'Religieuse, dans des salles de culte et des monastères', b: 'Décor d’une résidence royale, sur une paroi extérieure' },
    ],
    aRetenir: 'Deux témoins contemporains de la grande peinture murale d’Asie du Sud, l’un religieux, l’autre de cour.',
  },
  {
    id: 'cmp-harihara-jayavarman',
    titre: 'Préangkorien ou style du Bayon ?',
    a: 'ref-harihara-maha-rosei',
    b: 'ref-jayavarman-vii',
    criteres: [
      { critere: 'Date', a: 'VIIe s. (?)', b: 'Fin du XIIe – début du XIIIe s.' },
      { critere: 'Sujet', a: 'Divinité syncrétique hindoue en pied', b: 'Portrait présumé d’un roi bouddhiste' },
      { critere: 'Technique', a: 'Ronde-bosse consolidée par un arc de soutien', b: 'Ronde-bosse libre, sans arc' },
      { critere: 'Expression', a: 'Visage impassible, volumes puissants', b: 'Yeux clos, sourire intérieur, recueillement' },
    ],
    aRetenir: 'Deux pièces majeures du Musée Guimet qui encadrent l’histoire de la sculpture khmère : idéal pour l’oral.',
  },
  {
    id: 'cmp-hamzanama-gitagovinda',
    titre: 'Peinture moghole ou pahāṛī ?',
    a: 'ref-hamzanama',
    b: 'ref-gita-govinda-kangra',
    criteres: [
      { critere: 'Commanditaire', a: 'L’empereur Akbar', b: 'Cours rajpoutes des collines (Kangra)' },
      { critere: 'Date', a: 'Vers 1562–1577', b: 'Vers 1775–1780' },
      { critere: 'Support et format', a: 'Grandes peintures sur coton', b: 'Petites peintures sur papier' },
      { critere: 'Sujet', a: 'Épopée d’Amir Hamza (littérature persane)', b: 'Amours de Rādhā et Kṛṣṇa (dévotion, bhakti)' },
      { critere: 'Style', a: 'Énergie, mouvement, violence des scènes ; synthèse persane et indienne', b: 'Lyrisme, finesse, paysages verdoyants' },
    ],
    aRetenir: 'Deux moments de la peinture indienne : l’atelier impérial naissant et l’apogée des petites cours des collines.',
  },
  {
    id: 'cmp-roues-de-la-loi',
    titre: 'Deux roues de la Loi',
    a: 'ref-chapiteau-sarnath',
    b: 'ref-dharmacakra-dvaravati',
    criteres: [
      { critere: 'Date', a: 'Vers 250 av. J.-C.', b: 'VIIe–IXe s.' },
      { critere: 'Lieu', a: 'Inde du Nord, règne d’Aśoka', b: 'Thaïlande centrale, culture môn de Dvāravatī' },
      { critere: 'Fonction', a: 'Couronnement d’un pilier commémoratif, sous des lions', b: 'Roue dressée sur un pilier, parfois avec une gazelle couchée' },
      { critere: 'Style', a: 'Poli « maurya », lions d’inspiration achéménide', b: 'Grande roue ajourée au décor végétal' },
    ],
    aRetenir: 'La persistance d’un symbole du premier sermon, de l’Inde ancienne à l’Asie du Sud-Est, sur près d’un millénaire.',
  },
  {
    id: 'cmp-elephanta-ellora',
    titre: 'Grotte ou temple monolithe ?',
    a: 'ref-elephanta',
    b: 'ref-kailasa-ellora',
    criteres: [
      { critere: 'Date', a: 'Milieu du VIe s.', b: 'VIIIe s.' },
      { critere: 'Architecture', a: 'Grotte creusée : salle à piliers dans la roche', b: 'Temple entier dégagé de la roche, de haut en bas' },
      { critere: 'Programme', a: 'Sadāśiva colossal et grands panneaux shivaïtes', b: 'Temple complet (vimāna, Nandi, salles) ; Rāvaṇa ébranlant le Kailāsa' },
      { critere: 'Dynastie', a: 'Discutée (souvent les Kalacuri)', b: 'Rāṣṭrakūṭa (Kṛṣṇa Ier)' },
    ],
    aRetenir: 'Deux étapes de l’architecture rupestre shivaïte du Dekkan : de la grotte creusée au temple sculpté comme un bloc.',
  },
  {
    id: 'cmp-galvihara-sukhothai',
    titre: 'Sri Lanka et Sukhothai',
    a: 'ref-gal-vihara',
    b: 'ref-bouddha-marchant-sukhothai',
    criteres: [
      { critere: 'Lieu et date', a: 'Polonnaruwa (Sri Lanka), XIIe s.', b: 'Sukhothai (Thaïlande), XIVe s.' },
      { critere: 'Matériau', a: 'Granit, sculpture rupestre', b: 'Bronze' },
      { critere: 'Attitudes', a: 'Assis, debout, couché (parinirvāṇa)', b: 'Marchant, création propre à Sukhothai' },
      { critere: 'Lien', a: 'Foyer du bouddhisme theravāda', b: 'Theravāda reçu de Sri Lanka ; flamme crânienne d’origine cinghalaise' },
    ],
    aRetenir: 'Comment le bouddhisme cinghalais nourrit l’art thaï, qui invente pourtant ses propres formes.',
  },
  {
    id: 'cmp-anantashayana',
    titre: 'Viṣṇu couché, du relief au bronze',
    a: 'ref-deogarh',
    b: 'ref-vishnu-mebon',
    criteres: [
      { critere: 'Date', a: 'Début du VIe s.', b: 'XIe s.' },
      { critere: 'Technique', a: 'Relief en grès, sur la paroi extérieure d’un temple', b: 'Bronze creux, autrefois doré, en ronde-bosse' },
      { critere: 'Contexte', a: 'Inde du Nord, temple de Daśāvatāra', b: 'Angkor, au centre d’un immense réservoir (baray)' },
      { critere: 'Lecture', a: 'Récit : Brahmā sur le lotus, démons, divinités', b: 'Image isolée, liée à l’eau et à la fertilité' },
    ],
    aRetenir: 'Un même mythe, le sommeil cosmique de Viṣṇu, traité en Inde puis au Cambodge, avec cinq siècles d’écart.',
  },
];
