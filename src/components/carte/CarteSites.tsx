import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AIRES, aireParId, periodeParId } from '../../domain/catalogue';
import { siteCourt, surLaCarte } from '../../domain/reperes';
import type { Oeuvre } from '../../domain/types';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';
import { ajouterFond, BORNES_REGION, couleurAire } from './fond';

/** Carte des sites et des centres artistiques : un point par lieu, relié aux fiches. */
export default function CarteSites({ ouvrirFiche }: { ouvrirFiche: (id: string) => void }) {
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const [aire, setAire] = useState('');
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map>();
  const calque = useRef<L.LayerGroup>();

  const visibles = useMemo(() => (oeuvres ?? []).filter(surLaCarte).filter((o) => !aire || o.aireId === aire), [oeuvres, aire]);
  const sansCoordonnees = (oeuvres ?? []).filter((o) => !surLaCarte(o)).length;

  useEffect(() => {
    if (!conteneur.current || carte.current) return;
    carte.current = L.map(conteneur.current, { zoomSnap: 0.5 }).fitBounds(BORNES_REGION);
    ajouterFond(carte.current, true);
    calque.current = L.layerGroup().addTo(carte.current);
    return () => {
      carte.current?.stop();
      carte.current?.remove();
      carte.current = undefined;
    };
  }, []);

  useEffect(() => {
    const c = carte.current;
    const groupe = calque.current;
    if (!c || !groupe) return;
    groupe.clearLayers();
    // Plusieurs fiches au même endroit (Angkor, Sarnath…) : un seul point, une liste dans la bulle.
    const parLieu = new Map<string, Oeuvre[]>();
    for (const o of visibles) {
      const cle = `${o.lat!.toFixed(3)},${o.lng!.toFixed(3)}`;
      parLieu.set(cle, [...(parLieu.get(cle) ?? []), o]);
    }
    for (const liste of parLieu.values()) {
      const [o] = liste;
      const bulle = document.createElement('div');
      bulle.className = 'bulle-carte';
      const titre = document.createElement('strong');
      titre.textContent = siteCourt(o.site) || o.titre;
      bulle.append(titre);
      for (const x of liste) {
        const bouton = document.createElement('button');
        bouton.className = 'bulle-fiche';
        bouton.textContent = `${x.titre}${x.datation ? ` · ${x.datation}` : ''}`;
        bouton.onclick = () => ouvrirFiche(x.id);
        bulle.append(bouton);
      }
      const periode = periodeParId(o.periodeId)?.nom;
      if (periode) {
        const p = document.createElement('span');
        p.className = 'bulle-detail';
        p.textContent = `${aireParId(o.aireId)?.nom ?? ''} · ${periode}`;
        bulle.append(p);
      }
      L.circleMarker([o.lat!, o.lng!], { radius: liste.length > 1 ? 10 : 8, color: '#ffffff', weight: 2, fillColor: couleurAire(o.aireId), fillOpacity: 0.95 })
        .bindPopup(bulle)
        .bindTooltip(siteCourt(o.site) || o.titre, { direction: 'top', offset: [0, -8] })
        .addTo(groupe);
    }
    if (visibles.length > 0 && aire) c.fitBounds(L.latLngBounds(visibles.map((o) => [o.lat!, o.lng!])), { padding: [40, 40], maxZoom: 8 });
    else if (!aire) c.fitBounds(BORNES_REGION);
  }, [visibles, aire, ouvrirFiche]);

  return (
    <section className="panneau carte-page">
      <div className="barre-recherche">
        <select value={aire} onChange={(e) => setAire(e.target.value)} aria-label="Aire culturelle">
          <option value="">Toutes les aires</option>
          {AIRES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </div>
      <div ref={conteneur} className="carte-leaflet" role="region" aria-label="Carte des sites" />
      <p className="discret">
        {visibles.length} œuvre{visibles.length > 1 ? 's' : ''} placée{visibles.length > 1 ? 's' : ''} sur la carte. Touche un point pour ouvrir la fiche.
        {sansCoordonnees > 0 &&
          ` ${sansCoordonnees} fiche${sansCoordonnees > 1 ? 's' : ''} sans coordonnées (à ajouter dans « Modifier » pour ${sansCoordonnees > 1 ? 'les' : 'la'} placer).`}
      </p>
      <div className="legende">
        {AIRES.map((a, i) => (
          <span key={a.id}>
            <i className={`t${i % 10}`} /> {a.nom}
          </span>
        ))}
      </div>
    </section>
  );
}
