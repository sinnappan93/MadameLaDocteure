import { useState } from 'react';
import { REFERENCES } from '../data/references';
import { restaurerReferences } from '../lib/db';
import type { Reglages, Theme } from '../lib/reglages';

interface Props {
  reglages: Reglages;
  modifier: (c: Partial<Reglages>) => void;
  aller: (ecran: 'accueil' | 'oeuvres' | 'aide') => void;
  fermer: () => void;
}

const THEMES: Array<[Theme, string]> = [
  ['auto', 'Auto'],
  ['clair', 'Clair'],
  ['sombre', 'Sombre'],
];

export function Menu({ reglages, modifier, aller, fermer }: Props) {
  const [restauration, setRestauration] = useState<string>();
  const restaurer = async () => {
    const n = await restaurerReferences();
    setRestauration(n === 0 ? 'Toutes les fiches préparées sont déjà présentes.' : `${n} fiche${n > 1 ? 's' : ''} restaurée${n > 1 ? 's' : ''}.`);
  };
  return (
    <div className="feuille-fond tiroir-fond" onClick={fermer}>
      <nav className="tiroir" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-entete">
          <Logo />
          <button className="bouton-icone" onClick={fermer} aria-label="Fermer le menu">
            ✕
          </button>
        </div>
        <button className="entree-menu" onClick={() => aller('accueil')}>
          Accueil
        </button>
        <button className="entree-menu" onClick={() => aller('oeuvres')}>
          Œuvres de référence
        </button>
        <button className="entree-menu entree-aide" onClick={() => aller('aide')}>
          Comment m’utiliser ?
        </button>
        <p className="discret bientot">Bientôt : révisions, frise, carte, sujets blancs, oral.</p>

        <h3>Réglages</h3>
        <div className="formulaire">
          <label>
            Prénom
            <input value={reglages.prenom} placeholder="Docteure" onChange={(e) => modifier({ prenom: e.target.value })} />
          </label>
          <label>
            Date des écrits (estimation)
            <input type="date" value={reglages.dateEcrits} onChange={(e) => e.target.value && modifier({ dateEcrits: e.target.value })} />
          </label>
          <div>
            <span className="libelle">Thème</span>
            <div className="onglets" role="radiogroup" aria-label="Thème">
              {THEMES.map(([id, nom]) => (
                <button key={id} role="radio" aria-checked={reglages.theme === id} className={reglages.theme === id ? 'actif' : ''} onClick={() => modifier({ theme: id })}>
                  {nom}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="libelle">Fiches préparées ({REFERENCES.length})</span>
            <button type="button" className="bouton large" onClick={restaurer}>
              Restaurer les fiches préparées supprimées
            </button>
            {restauration && <p className="discret">{restauration}</p>}
          </div>
        </div>
      </nav>
    </div>
  );
}

export function Logo() {
  return (
    <span className="logo" aria-label="MadameLaDocteure">
      <span className="logo-script">Madame la</span>
      <span className="logo-gras">DOCTEURE</span>
    </span>
  );
}
