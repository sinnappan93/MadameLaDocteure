import type { Reglages, Theme } from '../lib/reglages';

interface Props {
  reglages: Reglages;
  modifier: (c: Partial<Reglages>) => void;
  aller: (ecran: 'accueil' | 'oeuvres') => void;
  fermer: () => void;
}

const THEMES: Array<[Theme, string]> = [
  ['auto', 'Auto'],
  ['clair', 'Clair'],
  ['sombre', 'Sombre'],
];

export function Menu({ reglages, modifier, aller, fermer }: Props) {
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
