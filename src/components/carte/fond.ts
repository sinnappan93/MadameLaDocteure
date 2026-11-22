import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AIRES } from '../../domain/catalogue';

/** Fonds CARTO (données OpenStreetMap) : avec noms pour consulter, sans noms pour le quiz. */
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>';

export function ajouterFond(carte: L.Map, avecNoms: boolean) {
  const style = avecNoms ? 'voyager' : 'voyager_nolabels';
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png`, {
    attribution: ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(carte);
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
