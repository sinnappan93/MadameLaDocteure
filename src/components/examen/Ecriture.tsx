import { useEffect, useRef, useState } from 'react';
import { TYPES_EPREUVE } from '../../data/sujets';
import { compterMots, type Copie } from '../../domain/examen';
import { db, modifierCopie } from '../../lib/db';
import { BandeauChrono, useChrono } from './Chrono';

/** Épreuve en cours : chronomètre, rédaction avec sauvegarde automatique, puis remise de la copie. */
export function Ecriture({ id, rendue }: { id: string; rendue: (id: string) => void }) {
  const [copie, setCopie] = useState<Copie>();
  const [texte, setTexte] = useState('');
  const [problematique, setProblematique] = useState('');
  const [plan, setPlan] = useState('');
  const [sauve, setSauve] = useState(true);
  const minuteur = useRef<ReturnType<typeof setTimeout>>();

  // Chargé une seule fois : la saisie locale fait foi ensuite.
  useEffect(() => {
    db.copies.get(id).then((c) => {
      if (!c) return;
      setCopie(c);
      setTexte(c.texte);
      setProblematique(c.problematique ?? '');
      setPlan(c.plan ?? '');
    });
  }, [id]);

  const restant = useChrono(copie?.debut ?? new Date().toISOString(), copie?.dureePrevueMin ?? 1, !copie);

  // Sauvegarde automatique, une seconde après la dernière frappe.
  const programmer = (changements: Partial<Copie>) => {
    setSauve(false);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(async () => {
      await modifierCopie(id, changements);
      setSauve(true);
    }, 800);
  };
  useEffect(() => () => clearTimeout(minuteur.current), []);

  if (!copie) return <section className="panneau" />;
  const estPlan = copie.type === 'plan';

  const rendre = async () => {
    if (!confirm('Rendre la copie ? Tu ne pourras plus la modifier.')) return;
    clearTimeout(minuteur.current);
    await modifierCopie(id, { texte, problematique: estPlan ? problematique : undefined, plan: estPlan ? plan : undefined, fin: new Date().toISOString() });
    rendue(id);
  };

  return (
    <section className="panneau examen ecriture">
      <BandeauChrono restant={restant} dureeMin={copie.dureePrevueMin} />
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">{estPlan ? 'Plan en 15 minutes' : TYPES_EPREUVE.find((t) => t.id === copie.type)?.nom}</span>
        <span className="carte-sujet-intitule">{copie.sujet}</span>
      </div>

      {estPlan ? (
        <div className="formulaire">
          <label>
            Problématique
            <textarea
              rows={4}
              value={problematique}
              placeholder="Définis les termes, pose la question qui guidera ta démonstration."
              onChange={(e) => {
                setProblematique(e.target.value);
                programmer({ problematique: e.target.value, plan });
              }}
            />
          </label>
          <label>
            Plan détaillé
            <textarea
              rows={12}
              value={plan}
              placeholder={'I. …\n   A. …\n   B. …\nII. …\n   A. …\n   B. …'}
              onChange={(e) => {
                setPlan(e.target.value);
                programmer({ plan: e.target.value, problematique });
              }}
            />
          </label>
        </div>
      ) : copie.mode === 'texte' ? (
        <textarea
          className="copie-texte"
          value={texte}
          spellCheck
          lang="fr"
          placeholder="Introduction…"
          onChange={(e) => {
            setTexte(e.target.value);
            programmer({ texte: e.target.value });
          }}
        />
      ) : (
        <div className="manuscrit">
          <p>Écris sur papier. Garde cet écran ouvert pour suivre le temps ; à la fin, rends la copie puis photographie chaque page.</p>
        </div>
      )}

      <div className="pied-ecriture">
        <span className="discret">
          {!estPlan && copie.mode === 'texte' && `${compterMots(texte)} mots · `}
          {sauve ? 'Enregistré' : 'Enregistrement…'}
        </span>
        <button className="bouton principal" onClick={rendre}>
          Rendre la copie
        </button>
      </div>
    </section>
  );
}
