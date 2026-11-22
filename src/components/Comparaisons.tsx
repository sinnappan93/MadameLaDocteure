import { COMPARAISONS } from '../data/comparaisons';
import type { Oeuvre } from '../domain/types';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';
import { TableauCriteres } from './Revision';
import { Vignette } from './Vignette';

/** Toutes les comparaisons, avec leurs critères : utile pour préparer dissertations et oraux. */
export function Comparaisons({ ouvrirFiche, reviser }: { ouvrirFiche: (id: string) => void; reviser: () => void }) {
  const fiches = useLive(async () => new Map((await db.oeuvres.toArray()).map((o) => [o.id, o] as [string, Oeuvre])), []);
  return (
    <section className="panneau comparaisons">
      <button className="carte-du-jour" onClick={reviser}>
        <span>
          <span className="carte-du-jour-titre">S’entraîner à comparer</span>
          <span className="carte-du-jour-detail">{COMPARAISONS.length} comparaisons en cartes, avec répétition espacée</span>
        </span>
        <span className="carte-du-jour-bouton">Réviser</span>
      </button>
      {COMPARAISONS.map((c) => {
        const a = fiches?.get(c.a);
        const b = fiches?.get(c.b);
        return (
          <details key={c.id} className="comparaison">
            <summary>
              <span className="duo mini">
                <Vignette imageId={a?.imagePrincipaleId} alt="" className="duo-image" />
                <Vignette imageId={b?.imagePrincipaleId} alt="" className="duo-image" />
              </span>
              <span className="comparaison-texte">
                <span className="carte-revision-titre">{c.titre}</span>
                <span className="discret">
                  1. {a?.titre ?? 'fiche supprimée'} · 2. {b?.titre ?? 'fiche supprimée'}
                </span>
              </span>
            </summary>
            <TableauCriteres comparaison={c} />
            <div className="exemples">
              {[a, b].map(
                (o, i) =>
                  o && (
                    <button key={o.id} className="puce-fiche" onClick={() => ouvrirFiche(o.id)}>
                      {i + 1}. {o.titre}
                    </button>
                  ),
              )}
            </div>
          </details>
        );
      })}
    </section>
  );
}
