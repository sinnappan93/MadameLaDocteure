import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { distanceKm, SEUIL_CARTE_KM, siteCourt } from '../../domain/reperes';
import type { Note } from '../../domain/revision';
import type { Oeuvre } from '../../domain/types';
import { ajouterFond, BORNES_REGION } from './fond';

/** « Place Ellora sur la carte » : la carte n'a pas de noms ; un toucher place le point, puis on montre le vrai lieu. */
export default function QuestionCarte({ oeuvre, repondre }: { oeuvre: Oeuvre; repondre: (n: Note) => void }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number>();

  useEffect(() => {
    if (!conteneur.current) return;
    const carte = L.map(conteneur.current, { zoomSnap: 0.5 }).fitBounds(BORNES_REGION);
    ajouterFond(carte, false);
    const vrai: [number, number] = [oeuvre.lat!, oeuvre.lng!];
    let repondu = false;
    carte.on('click', (e: L.LeafletMouseEvent) => {
      if (repondu) return;
      repondu = true;
      const choisi: [number, number] = [e.latlng.lat, e.latlng.lng];
      const d = distanceKm(choisi, vrai);
      const juste = d <= SEUIL_CARTE_KM;
      L.circleMarker(choisi, { radius: 8, color: '#fff', weight: 2, fillColor: juste ? '#3f9e6e' : '#d9534f', fillOpacity: 1 }).addTo(carte);
      L.circleMarker(vrai, { radius: 9, color: '#fff', weight: 2, fillColor: '#ef8a4c', fillOpacity: 1 })
        .bindTooltip(siteCourt(oeuvre.site), { permanent: true, direction: 'top', offset: [0, -8] })
        .addTo(carte);
      L.polyline([choisi, vrai], { color: '#ef8a4c', dashArray: '6 6', weight: 2 }).addTo(carte);
      carte.fitBounds(L.latLngBounds([choisi, vrai]), { padding: [60, 60], maxZoom: 7 });
      setDistance(d);
    });
    return () => {
      carte.remove();
    };
  }, [oeuvre.id]);

  const juste = distance !== undefined && distance <= SEUIL_CARTE_KM;
  return (
    <div className="carte-question">
      <p className="consigne">Place sur la carte : {siteCourt(oeuvre.site)}</p>
      <p className="discret centre">{oeuvre.titre}</p>
      <div ref={conteneur} className="carte-leaflet quiz" role="region" aria-label="Carte sans noms de lieux : touche l’emplacement" />
      {distance === undefined ? (
        <p className="discret centre">Touche la carte à l’emplacement du site (zoome si besoin). Réussi à moins de {SEUIL_CARTE_KM} km.</p>
      ) : (
        <>
          <p className={`verdict ${juste ? 'juste' : 'faux'}`}>
            {distance < 50 ? 'En plein dans le mille !' : juste ? 'Bien placé !' : 'Trop loin.'} ({Math.round(distance)} km)
          </p>
          <button className="bouton principal large grand" onClick={() => repondre(juste ? 2 : 0)}>
            Continuer
          </button>
        </>
      )}
    </div>
  );
}
