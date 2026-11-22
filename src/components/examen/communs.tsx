import { type TypeEpreuve, TYPES_EPREUVE } from '../../data/sujets';
import { type Sujet, sujetsProposes } from '../../domain/examen';
import { db } from '../../lib/db';
import { useLive } from '../../lib/useLive';

/** Tous les sujets : proposés + ajoutés (jury, perso, IA), les plus récents d'abord. */
export function useSujets(): Sujet[] | undefined {
  const perso = useLive(() => db.sujets.toArray(), []);
  if (!perso) return undefined;
  return [...[...perso].sort((a, b) => (b.creeLe ?? '').localeCompare(a.creeLe ?? '')), ...sujetsProposes()];
}

export function ChoixType({ valeur, changer, sans }: { valeur: TypeEpreuve; changer: (t: TypeEpreuve) => void; sans?: TypeEpreuve[] }) {
  return (
    <div className="puces" role="radiogroup" aria-label="Épreuve">
      {TYPES_EPREUVE.filter((t) => !sans?.includes(t.id)).map((t) => (
        <button key={t.id} role="radio" aria-checked={valeur === t.id} className={valeur === t.id ? 'actif' : ''} onClick={() => changer(t.id)}>
          {t.court}
        </button>
      ))}
    </div>
  );
}
