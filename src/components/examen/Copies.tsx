import { TYPES_EPREUVE } from '../../data/sujets';
import { type Copie, formatDuree, noteRetenue } from '../../domain/examen';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';

const nomType = (c: Copie) => (c.type === 'plan' ? 'Plan en 15 minutes' : TYPES_EPREUVE.find((t) => t.id === c.type)?.nom ?? c.type);
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Historique des copies et des plans, avec leur état de correction. */
export function Copies({ ouvrir, reprendre }: { ouvrir: (id: string) => void; reprendre: (id: string) => void }) {
  const copies = useLive(async () => (await db.copies.toArray()).sort((a, b) => b.debut.localeCompare(a.debut)), []);
  if (!copies) return <section className="panneau" />;
  const notes = copies.flatMap((c) => noteRetenue(c)?.note ?? []);
  const corrigees = notes;
  const moyenne = notes.length ? notes.reduce((t, n) => t + n, 0) / notes.length : undefined;
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
            <span className="stat-libelle">moyenne indicative</span>
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
              <span className={`etat-copie ${noteRetenue(c) || c.commentairePlan ? 'ok' : ''}`}>
                {!c.fin
                  ? 'En cours : reprendre'
                  : noteRetenue(c)
                    ? `Corrigée · ${String(noteRetenue(c)!.note).replace('.', ',')}/20${noteRetenue(c)!.source === 'correcteur' ? ' (correcteur)' : ''}`
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
