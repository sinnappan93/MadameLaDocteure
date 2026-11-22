import { TYPES_EPREUVE } from '../../data/sujets';
import { type Copie, formatDuree } from '../../domain/examen';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';

const nomType = (c: Copie) => (c.type === 'plan' ? 'Plan en 15 minutes' : TYPES_EPREUVE.find((t) => t.id === c.type)?.nom ?? c.type);
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Historique des copies et des plans, avec leur état de correction. */
export function Copies({ ouvrir, reprendre }: { ouvrir: (id: string) => void; reprendre: (id: string) => void }) {
  const copies = useLive(async () => (await db.copies.toArray()).sort((a, b) => b.debut.localeCompare(a.debut)), []);
  if (!copies) return <section className="panneau" />;
  const corrigees = copies.filter((c) => c.correction);
  const moyenne = corrigees.length ? corrigees.reduce((t, c) => t + c.correction!.noteSur20, 0) / corrigees.length : undefined;
  return (
    <section className="panneau examen">
      {corrigees.length > 0 && (
        <div className="stats-revision">
          <div className="stat">
            <span className="stat-valeur">{copies.length}</span>
            <span className="stat-libelle">copies et plans</span>
          </div>
          <div className="stat">
            <span className="stat-valeur">{moyenne!.toFixed(1).replace('.', ',')}</span>
            <span className="stat-libelle">moyenne indicative (IA)</span>
          </div>
        </div>
      )}
      {copies.length === 0 && <p className="vide-etat">Aucune copie pour l’instant : lance un sujet blanc ou un plan en 15 minutes.</p>}
      <ul className="liste-sujets">
        {copies.map((c) => (
          <li key={c.id} className="sujet">
            <button className="copie-ligne" onClick={() => (c.fin ? ouvrir(c.id) : reprendre(c.id))}>
              <span className="carte-mot-categorie">
                {nomType(c)} · {dateCourte(c.debut)} · {formatDuree(c.dureePrevueMin)}
              </span>
              <span className="sujet-intitule">{c.sujet}</span>
              <span className={`etat-copie ${c.correction || c.commentairePlan ? 'ok' : ''}`}>
                {!c.fin
                  ? 'En cours : reprendre'
                  : c.correction
                    ? `Corrigée · ${String(c.correction.noteSur20).replace('.', ',')}/20`
                    : c.commentairePlan
                      ? 'Commentée par l’IA'
                      : 'Rendue · pas encore corrigée'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
