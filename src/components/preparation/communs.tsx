import { useMemo } from 'react';
import { activitesDuJour, estFaite, NOMS_SEANCES, type Seance, type TypeSeance } from '../../domain/plan';
import { db, marquerSeance } from '../../lib/db';
import { useLive } from '../../lib/useLive';

/** Couleur (tuile pastel) par type de séance. */
export const COULEUR_SEANCE: Record<TypeSeance, number> = {
  identifier: 1,
  glossaire: 2,
  comparer: 8,
  reperes: 7,
  lecture: 5,
  fiches: 4,
  plan15: 3,
  'sujet-blanc': 9,
  anglais: 6,
  visite: 0,
  oral: 3,
  situations: 8,
  repos: 7,
  jalon: 9,
};

/** Activités vues par l'appli, par jour (pour cocher automatiquement les séances). */
export function useActivites(): ((jour: string) => Set<TypeSeance>) | undefined {
  const donnees = useLive(async () => {
    const [etats, copies, oraux, visites, lectures] = await Promise.all([db.revisions.toArray(), db.copies.toArray(), db.oraux.toArray(), db.visites.toArray(), db.lectures.toArray()]);
    return { etats, copies, oraux, visites, lectures };
  }, []);
  return useMemo(() => {
    if (!donnees) return undefined;
    const cache = new Map<string, Set<TypeSeance>>();
    return (jour: string) => {
      if (!cache.has(jour)) cache.set(jour, activitesDuJour(jour, donnees));
      return cache.get(jour)!;
    };
  }, [donnees]);
}

/** Une séance du plan : case à cocher, titre, durée, description et bouton pour la commencer. */
export function LigneSeance({ s, activites, lancer, compacte }: { s: Seance; activites?: Set<TypeSeance>; lancer?: (s: Seance) => void; compacte?: boolean }) {
  const auto = !s.faite && activites && estFaite(s, activites);
  const faite = !!s.faite || !!auto;
  const jalon = s.type === 'jalon';
  return (
    <div className={`seance t-fond${COULEUR_SEANCE[s.type]} ${faite ? 'faite' : ''} ${jalon ? 'jalon' : ''}`}>
      {!jalon && s.type !== 'repos' ? (
        <input
          type="checkbox"
          checked={faite}
          aria-label={faite ? `${s.titre} : faite` : `Marquer « ${s.titre} » comme faite`}
          onChange={(e) => marquerSeance(s.id, e.target.checked)}
          title={auto ? 'Cochée automatiquement : l’appli a vu cette activité aujourd’hui' : undefined}
        />
      ) : (
        <span className="seance-icone" aria-hidden>
          {jalon ? '★' : '☾'}
        </span>
      )}
      <span className="seance-texte">
        <span className="seance-titre">{s.titre}</span>
        <span className="seance-detail">
          {s.dureeMin > 0 && `${s.dureeMin} min · `}
          {jalon ? 'Jalon' : NOMS_SEANCES[s.type]}
          {auto && ' · vue par l’appli'}
        </span>
        {!compacte && s.description && <span className="seance-description">{s.description}</span>}
      </span>
      {lancer && !jalon && s.type !== 'repos' && (
        <button className="bouton petit" onClick={() => lancer(s)}>
          {faite ? 'Refaire' : 'Commencer'}
        </button>
      )}
    </div>
  );
}

export const jourLong = (jour: string) =>
  new Date(`${jour}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const jourCourt = (jour: string) => new Date(`${jour}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
