import { cleJour } from '../../domain/plan';
import type { Seance } from '../../domain/plan';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';
import { jourLong, LigneSeance, useActivites } from './communs';

/** Carte de l'accueil : les séances du jour (ou une invitation à créer le plan). */
export function Aujourdhui({ ouvrirPlan, lancer }: { ouvrirPlan: () => void; lancer: (s: Seance) => void }) {
  const aujourdhui = cleJour(new Date());
  const donnees = useLive(async () => {
    const total = await db.seances.count();
    const avenir = await db.seances.where('date').aboveOrEqual(aujourdhui).limit(40).toArray();
    return { total, avenir };
  }, [aujourdhui]);
  const activites = useActivites();
  if (!donnees) return null;
  if (donnees.total === 0)
    return (
      <button className="carte-du-jour plan-invitation" onClick={ouvrirPlan}>
        <span>
          <span className="carte-du-jour-titre">Ton plan de révision</span>
          <span className="carte-du-jour-detail">Un calendrier semaine par semaine jusqu’aux oraux, adapté à ton temps et à tes lacunes.</span>
        </span>
        <span className="carte-du-jour-bouton">Créer</span>
      </button>
    );
  const duJour = donnees.avenir.filter((s) => s.date === aujourdhui);
  const prochain = donnees.avenir.find((s) => s.date > aujourdhui && s.type !== 'jalon');
  const jalon = donnees.avenir.find((s) => s.type === 'jalon');
  return (
    <div className="bloc-aujourdhui">
      <div className="titre-section">
        <h2>Aujourd’hui</h2>
        <button className="lien" onClick={ouvrirPlan}>
          Calendrier
        </button>
      </div>
      {duJour.length ? (
        duJour.map((s) => <LigneSeance key={s.id} s={s} activites={activites?.(aujourdhui)} lancer={lancer} compacte />)
      ) : (
        <p className="discret">
          Pas de séance prévue aujourd’hui.{prochain && ` Prochaine : ${prochain.titre}, ${jourLong(prochain.date)}.`}
        </p>
      )}
      {jalon && (
        <p className="discret prochain-jalon">
          ★ {jalon.titre} : {jourLong(jalon.date)}
        </p>
      )}
    </div>
  );
}
