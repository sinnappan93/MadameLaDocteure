import { useState } from 'react';
import { cleJour } from '../../domain/plan';
import type { Seance } from '../../domain/plan';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';
import { jourLong, LigneSeance, useActivites } from './communs';
import { Mois } from './PlanRevision';

/** Bloc de l'accueil : calendrier du mois et séances du jour choisi (ou une invitation à créer le plan). */
export function Aujourdhui({ ouvrirPlan, lancer }: { ouvrirPlan: () => void; lancer: (s: Seance) => void }) {
  const aujourdhui = cleJour(new Date());
  const seances = useLive(() => db.seances.orderBy('date').toArray(), []);
  const activites = useActivites();
  const [mois, setMois] = useState(aujourdhui.slice(0, 7));
  const [jour, setJour] = useState(aujourdhui);
  if (!seances) return null;
  if (seances.length === 0)
    return (
      <button className="carte-du-jour plan-invitation" onClick={ouvrirPlan}>
        <span>
          <span className="carte-du-jour-titre">Ton plan de révision</span>
          <span className="carte-du-jour-detail">Un calendrier semaine par semaine jusqu’aux oraux, adapté à ton temps et à tes lacunes.</span>
        </span>
        <span className="carte-du-jour-bouton">Créer</span>
      </button>
    );
  const duJour = seances.filter((s) => s.date === jour);
  const prochain = seances.find((s) => s.date > jour && s.type !== 'jalon');
  const jalon = seances.find((s) => s.type === 'jalon' && s.date >= aujourdhui);
  return (
    <div className="bloc-aujourdhui">
      <div className="titre-section">
        <h2>Mon calendrier</h2>
        <button className="lien" onClick={ouvrirPlan}>
          Plan complet
        </button>
      </div>
      <div className="calendrier-accueil">
        <Mois mois={mois} changerMois={setMois} seances={seances} jourChoisi={jour} choisir={setJour} aujourdhui={aujourdhui}>
          <div className="jour-plan">
            <h3>
              {jour === aujourdhui ? 'Aujourd’hui' : jourLong(jour)}
              {jour !== aujourdhui && (
                <button
                  className="lien retour-aujourdhui"
                  onClick={() => {
                    setJour(aujourdhui);
                    setMois(aujourdhui.slice(0, 7));
                  }}
                >
                  revenir à aujourd’hui
                </button>
              )}
            </h3>
            {duJour.length ? (
              duJour.map((s) => <LigneSeance key={s.id} s={s} activites={jour <= aujourdhui ? activites?.(jour) : undefined} lancer={lancer} compacte />)
            ) : (
              <p className="discret">
                Pas de séance prévue {jour === aujourdhui ? 'aujourd’hui' : 'ce jour-là'}.{prochain && ` Prochaine : ${prochain.titre}, ${jourLong(prochain.date)}.`}
              </p>
            )}
            {jalon && (
              <p className="discret prochain-jalon">
                ★ {jalon.titre} : {jourLong(jalon.date)}
              </p>
            )}
          </div>
        </Mois>
      </div>
    </div>
  );
}
