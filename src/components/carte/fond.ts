import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AIRES } from '../../domain/catalogue';

interface Fond {
  url: string;
  attribution: string;
  maxNativeZoom: number;
}

const OSM = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ESRI = (source: string) => `Fond © Esri — ${source}`;
const esri = (service: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;

/**
 * Fonds gratuits et sans clé, par ordre de préférence ; si l'un échoue, on passe au suivant.
 * (CARTO, utilisé au départ, exige désormais une clé d'API.)
 */
const FONDS_AVEC_NOMS: Fond[] = [
  // Noms de lieux en alphabet latin (OpenStreetMap les écrit dans l'écriture locale).
  { url: esri('World_Street_Map'), attribution: ESRI('Esri, HERE, Garmin, OpenStreetMap'), maxNativeZoom: 18 },
  { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM, maxNativeZoom: 19 },
];

/** Pour le quiz : aucun nom de lieu, mais le relief et les fleuves pour se repérer. */
const FONDS_SANS_NOMS: Fond[] = [
  { url: esri('World_Physical_Map'), attribution: ESRI('US National Park Service'), maxNativeZoom: 8 },
  { url: esri('World_Imagery'), attribution: ESRI('Esri, Maxar, Earthstar Geographics'), maxNativeZoom: 18 },
];

/** Nombre de tuiles en erreur avant de changer de fond. */
const SEUIL_ERREURS = 4;

export function ajouterFond(carte: L.Map, avecNoms: boolean) {
  const fonds = avecNoms ? FONDS_AVEC_NOMS : FONDS_SANS_NOMS;
  let indice = 0;
  let erreurs = 0;
  let calque: L.TileLayer;
  const poser = () => {
    const f = fonds[indice];
    // crossOrigin : tuiles en CORS (les serveurs l'autorisent), pour pouvoir les garder hors ligne.
    calque = L.tileLayer(f.url, { attribution: f.attribution, maxNativeZoom: f.maxNativeZoom, maxZoom: 18, crossOrigin: true });
    calque.on('tileerror', () => {
      erreurs++;
      if (erreurs >= SEUIL_ERREURS && indice < fonds.length - 1) {
        carte.removeLayer(calque);
        indice++;
        erreurs = 0;
        poser();
      }
    });
    calque.on('tileload', () => {
      erreurs = 0;
    });
    calque.addTo(carte);
  };
  poser();
}

/** Couleur d'une aire : la même que sa tuile sur l'accueil. */
export function couleurAire(aireId?: string): string {
  const i = Math.max(0, AIRES.findIndex((a) => a.id === aireId));
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(`--t${i % 10}`).trim();
  return valeur || '#ef8a4c';
}

/** Vue d'ensemble de l'Asie du Sud et du Sud-Est. */
export const BORNES_REGION: L.LatLngBoundsExpression = [
  [-9, 62],
  [36, 112],
];
