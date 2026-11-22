/**
 * Repères de départ pour classer les œuvres : grandes périodes et aires culturelles de l'option
 * « Inde et monde indianisé ». Bornes indicatives (années, négatif = av. J.-C.), à affiner avec le programme.
 */

export interface Aire {
  id: string;
  nom: string;
  /** Complément de lieu : « au Cambodge », « en Inde du Nord »… */
  dans: string;
}

export interface Periode {
  id: string;
  nom: string;
  aireId: string;
  debut: number;
  fin: number;
}

export const AIRES: Aire[] = [
  { id: 'inde-nord', nom: 'Inde du Nord' , dans: 'en Inde du Nord' },
  { id: 'inde-sud', nom: 'Inde du Sud' , dans: 'en Inde du Sud' },
  { id: 'gandhara', nom: 'Gandhāra et Nord-Ouest' , dans: 'au Gandhāra et dans le Nord-Ouest' },
  { id: 'bengale', nom: 'Bengale et delta du Gange' , dans: 'au Bengale' },
  { id: 'sri-lanka', nom: 'Sri Lanka' , dans: 'à Sri Lanka' },
  { id: 'cambodge', nom: 'Cambodge' , dans: 'au Cambodge' },
  { id: 'champa', nom: 'Champa' , dans: 'au Champa' },
  { id: 'java', nom: 'Java et Sumatra' , dans: 'à Java et Sumatra' },
  { id: 'birmanie-thai', nom: 'Birmanie, Thaïlande, Laos' , dans: 'en Birmanie, Thaïlande et Laos' },
  { id: 'himalaya', nom: 'Népal et Himalaya' , dans: 'au Népal et dans l’Himalaya' },
];

export const PERIODES: Periode[] = [
  { id: 'harappa', nom: 'Civilisation de l’Indus', aireId: 'inde-nord', debut: -2600, fin: -1900 },
  { id: 'maurya', nom: 'Maurya', aireId: 'inde-nord', debut: -322, fin: -185 },
  { id: 'shunga', nom: 'Shunga', aireId: 'inde-nord', debut: -185, fin: -73 },
  { id: 'satavahana', nom: 'Sātavāhana (Amarāvatī)', aireId: 'inde-sud', debut: -100, fin: 225 },
  { id: 'kushan', nom: 'Kushān (Gandhāra, Mathurā)', aireId: 'gandhara', debut: 30, fin: 375 },
  { id: 'gupta', nom: 'Gupta', aireId: 'inde-nord', debut: 320, fin: 550 },
  { id: 'vakataka', nom: 'Vākāṭaka (Ajanta)', aireId: 'inde-nord', debut: 250, fin: 500 },
  { id: 'chalukya', nom: 'Chālukya', aireId: 'inde-sud', debut: 543, fin: 753 },
  { id: 'pallava', nom: 'Pallava', aireId: 'inde-sud', debut: 275, fin: 897 },
  { id: 'rashtrakuta', nom: 'Rāṣṭrakūṭa (Ellora)', aireId: 'inde-sud', debut: 753, fin: 982 },
  { id: 'pratihara', nom: 'Gurjara-Pratīhāra', aireId: 'inde-nord', debut: 730, fin: 1036 },
  { id: 'pala', nom: 'Pāla', aireId: 'bengale', debut: 750, fin: 1174 },
  { id: 'chola', nom: 'Chola', aireId: 'inde-sud', debut: 850, fin: 1279 },
  { id: 'chandela', nom: 'Chandela (Khajuraho)', aireId: 'inde-nord', debut: 831, fin: 1315 },
  { id: 'hoysala', nom: 'Hoysala', aireId: 'inde-sud', debut: 1026, fin: 1343 },
  { id: 'vijayanagara', nom: 'Vijayanagara', aireId: 'inde-sud', debut: 1336, fin: 1646 },
  { id: 'sultanats', nom: 'Sultanats', aireId: 'inde-nord', debut: 1206, fin: 1526 },
  { id: 'moghol', nom: 'Moghol', aireId: 'inde-nord', debut: 1526, fin: 1857 },
  { id: 'rajput', nom: 'Cours rajpoutes et pahari', aireId: 'inde-nord', debut: 1550, fin: 1900 },
  { id: 'colonial', nom: 'Inde coloniale', aireId: 'inde-nord', debut: 1757, fin: 1947 },
  { id: 'inde-moderne', nom: 'Inde moderne et contemporaine', aireId: 'inde-nord', debut: 1947, fin: 2100 },
  { id: 'anuradhapura', nom: 'Anurādhapura', aireId: 'sri-lanka', debut: -377, fin: 1017 },
  { id: 'polonnaruwa', nom: 'Polonnaruwa', aireId: 'sri-lanka', debut: 1017, fin: 1232 },
  { id: 'preangkorien', nom: 'Préangkorien (Funan, Chenla)', aireId: 'cambodge', debut: 100, fin: 802 },
  { id: 'angkor', nom: 'Angkorien', aireId: 'cambodge', debut: 802, fin: 1431 },
  { id: 'champa', nom: 'Champa (Mỹ Sơn, Đồng Dương)', aireId: 'champa', debut: 192, fin: 1832 },
  { id: 'java-central', nom: 'Java central (Borobudur, Prambanan)', aireId: 'java', debut: 700, fin: 930 },
  { id: 'java-oriental', nom: 'Java oriental (Majapahit)', aireId: 'java', debut: 930, fin: 1527 },
  { id: 'srivijaya', nom: 'Śrīvijaya', aireId: 'java', debut: 650, fin: 1300 },
  { id: 'dvaravati', nom: 'Dvāravatī', aireId: 'birmanie-thai', debut: 600, fin: 1100 },
  { id: 'pagan', nom: 'Pagan', aireId: 'birmanie-thai', debut: 849, fin: 1297 },
  { id: 'sukhothai', nom: 'Sukhothai et Ayutthaya', aireId: 'birmanie-thai', debut: 1238, fin: 1767 },
  { id: 'malla', nom: 'Malla (vallée de Katmandou)', aireId: 'himalaya', debut: 1200, fin: 1769 },
];

export function aireParId(id: string | undefined): Aire | undefined {
  return AIRES.find((a) => a.id === id);
}

export function periodeParId(id: string | undefined): Periode | undefined {
  return PERIODES.find((p) => p.id === id);
}

/** Formate une année : -185 → « 185 av. J.-C. », 320 → « 320 ». */
export function formatAnnee(annee: number): string {
  return annee < 0 ? `${-annee} av. J.-C.` : String(annee);
}
