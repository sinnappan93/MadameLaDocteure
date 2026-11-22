import { useEffect, useState } from 'react';
import { type TypeEpreuve, TYPES_EPREUVE } from '../../data/sujets';
import { DUREE_PAR_DEFAUT, DUREE_PLAN, DUREES, formatDuree, type Sujet, tirerSujet } from '../../domain/examen';
import { creerCopie, db } from '../../lib/db';
import { useLive } from '../../lib/useLive';
import { ChoixType, useSujets } from './communs';

/**
 * Préparation d'un sujet blanc (ou d'un « plan en 15 minutes ») : épreuve, sujet, mode d'écriture, durée.
 */
export function SujetBlanc({
  plan,
  sujetInitial,
  typeInitial = 'specialite',
  commencer,
}: {
  plan?: boolean;
  sujetInitial?: string;
  typeInitial?: TypeEpreuve;
  commencer: (copieId: string) => void;
}) {
  const sujets = useSujets();
  const faits = useLive(async () => (await db.copies.toArray()).map((c) => c.sujetId), []);
  const [type, setType] = useState<TypeEpreuve>(typeInitial);
  const [sujet, setSujet] = useState<Sujet>();
  const [mode, setMode] = useState<'texte' | 'manuscrit'>('texte');
  const [duree, setDuree] = useState(DUREE_PAR_DEFAUT);

  // Sujet choisi depuis la banque, ou tirage au hasard à l'ouverture.
  useEffect(() => {
    if (!sujets || sujet) return;
    const initial = sujets.find((s) => s.id === sujetInitial);
    if (initial && !(plan && initial.type === 'synthese')) {
      setType(initial.type);
      setSujet(initial);
    } else setSujet(tirerSujet(sujets, type, faits ?? []));
  }, [sujets, faits]);

  const changerType = (t: TypeEpreuve) => {
    setType(t);
    setSujet(sujets && tirerSujet(sujets, t, faits ?? []));
  };

  const lancer = async () => {
    if (!sujet) return;
    const copie = await creerCopie({
      type: plan ? 'plan' : type,
      sujetId: sujet.id,
      sujet: sujet.intitule,
      mode: plan ? 'texte' : mode,
      debut: new Date().toISOString(),
      dureePrevueMin: plan ? DUREE_PLAN : duree,
      problematique: plan ? '' : undefined,
      plan: plan ? '' : undefined,
    });
    commencer(copie.id);
  };

  const duType = (sujets ?? []).filter((s) => s.type === type);
  return (
    <section className="panneau examen">
      <p className="discret">
        {plan
          ? 'Un sujet, 15 minutes : rédige seulement la problématique et le plan détaillé. L’IA commente ensuite et propose un plan de comparaison.'
          : 'Un sujet blanc en conditions d’examen : chronomètre, écriture dans l’appli ou sur papier, puis correction par l’IA si tu le souhaites.'}
      </p>
      <span className="libelle">Épreuve</span>
      <ChoixType valeur={type} changer={changerType} sans={plan ? ['synthese'] : []} />

      <div className="carte-sujet">
        <span className="carte-mot-categorie">{TYPES_EPREUVE.find((t) => t.id === type)?.nom}</span>
        <span className="carte-sujet-intitule">{sujet?.intitule ?? 'Aucun sujet dans la banque pour cette épreuve.'}</span>
      </div>
      <div className="actions-sujet">
        <button className="bouton" onClick={() => setSujet(sujets && tirerSujet(sujets.filter((s) => s.id !== sujet?.id), type, faits ?? []))}>
          ⟳ Autre sujet au hasard
        </button>
        <select aria-label="Choisir un sujet" value={sujet?.id ?? ''} onChange={(e) => setSujet(duType.find((s) => s.id === e.target.value))}>
          {duType.map((s) => (
            <option key={s.id} value={s.id}>
              {s.intitule}
            </option>
          ))}
        </select>
      </div>

      {!plan && (
        <>
          <span className="libelle">Écriture</span>
          <div className="onglets" role="radiogroup" aria-label="Mode d’écriture">
            <button role="radio" aria-checked={mode === 'texte'} className={mode === 'texte' ? 'actif' : ''} onClick={() => setMode('texte')}>
              Dans l’appli
            </button>
            <button role="radio" aria-checked={mode === 'manuscrit'} className={mode === 'manuscrit' ? 'actif' : ''} onClick={() => setMode('manuscrit')}>
              Sur papier
            </button>
          </div>
          {mode === 'manuscrit' && <p className="discret">Tu écris sur papier avec le chronomètre ; à la fin, tu photographies chaque page pour la correction.</p>}
          <span className="libelle">Durée</span>
          <div className="puces" role="radiogroup" aria-label="Durée">
            {DUREES.map((d) => (
              <button key={d} role="radio" aria-checked={duree === d} className={duree === d ? 'actif' : ''} onClick={() => setDuree(d)}>
                {formatDuree(d)}
              </button>
            ))}
          </div>
          <p className="discret">Les durées officielles de 2027 seront fixées par l’arrêté : ajuste-les quand il sera publié.</p>
        </>
      )}

      <button className="bouton principal large grand" disabled={!sujet} onClick={lancer}>
        Commencer · {formatDuree(plan ? DUREE_PLAN : duree)}
      </button>
    </section>
  );
}
