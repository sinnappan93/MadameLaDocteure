import { useState } from 'react';
import { REFERENCES } from '../data/references';
import { restaurerReferences } from '../lib/db';
import { ReglagesIA } from './examen/ReglagesIA';
import type { Reglages, Theme } from '../lib/reglages';

export type EcranMenu =
  | 'accueil'
  | 'revision-oeuvres'
  | 'revision-comparaisons'
  | 'revision-glossaire'
  | 'revision-quiz'
  | 'revision-reperes'
  | 'revision-anglais'
  | 'examen-blanc'
  | 'examen-plan'
  | 'examen-copies'
  | 'examen-banque'
  | 'oral'
  | 'frise'
  | 'carte'
  | 'oeuvres'
  | 'comparaisons'
  | 'glossaire'
  | 'aide';

interface Props {
  reglages: Reglages;
  modifier: (c: Partial<Reglages>) => void;
  aller: (ecran: EcranMenu) => void;
  fermer: () => void;
  /** Écran affiché, mis en évidence dans le menu. */
  actuel?: EcranMenu;
}

const THEMES: Array<[Theme, string]> = [
  ['auto', 'Auto'],
  ['clair', 'Clair'],
  ['sombre', 'Sombre'],
];

const SECTIONS: Array<{ titre: string; icone: string; entrees: Array<[EcranMenu, string, string]> }> = [
  {
    titre: 'Exercices',
    icone: '✦',
    entrees: [
      ['revision-oeuvres', 'Identifier les œuvres', 'Photo, puis datation, site, musée, iconographie'],
      ['revision-comparaisons', 'Comparer deux œuvres', 'Côte à côte, puis les critères'],
      ['revision-glossaire', 'Glossaire en cartes', 'Termes et définitions'],
      ['revision-quiz', 'Quiz libre', 'QCM tout de suite, sans calendrier'],
      ['revision-reperes', 'Quiz de repères', 'Dynasties par siècle, sites sur la carte'],
    ],
  },
  {
    titre: 'Mode examen',
    icone: '✎',
    entrees: [
      ['examen-blanc', 'Sujets blancs', 'Chronométrés : spécialité, culture générale, synthèse'],
      ['examen-plan', 'Plan en 15 minutes', 'Problématique et plan, commentés par l’IA'],
      ['examen-copies', 'Mes copies et corrections', 'Correction par l’IA, grille de critères'],
      ['examen-banque', 'Banque de sujets', 'Rapports de jury, sujets proposés ou générés'],
      ['oral', 'Simulateur d’oral', 'Dossier, préparation, exposé enregistré, jury'],
      ['revision-anglais', 'Vocabulaire anglais', 'Fiches mémo pour l’épreuve de langue'],
    ],
  },
  {
    titre: 'Ressources',
    icone: '❖',
    entrees: [
      ['oeuvres', 'Œuvres de référence', 'Fiches, images, notices de musées'],
      ['comparaisons', 'Comparaisons', 'Paires d’œuvres et critères'],
      ['glossaire', 'Glossaire', 'Vocabulaire iconographique'],
      ['frise', 'Frise chronologique', 'Périodes et œuvres, par aire'],
      ['carte', 'Carte des sites', 'Sites et centres artistiques'],
    ],
  },
];

const BIENTOT = ['Démarches et plan de préparation', 'Bibliographie', 'Projection'];

export function Menu({ reglages, modifier, aller, fermer, actuel }: Props) {
  const [restauration, setRestauration] = useState<string>();
  const restaurer = async () => {
    const n = await restaurerReferences();
    setRestauration(n === 0 ? 'Toutes les fiches préparées sont déjà présentes.' : `${n} fiche${n > 1 ? 's' : ''} restaurée${n > 1 ? 's' : ''}.`);
  };
  const entree = (ecran: EcranMenu, nom: string, detail?: string) => (
    <button key={ecran} className={`entree-menu ${actuel === ecran ? 'courante' : ''}`} aria-current={actuel === ecran ? 'page' : undefined} onClick={() => aller(ecran)}>
      <span className="entree-nom">{nom}</span>
      {detail && <span className="entree-detail">{detail}</span>}
    </button>
  );
  return (
    <div className="feuille-fond tiroir-fond" onClick={fermer}>
      <nav className="tiroir" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-entete">
          <Logo />
          <button className="bouton-icone" onClick={fermer} aria-label="Fermer le menu">
            ✕
          </button>
        </div>

        {entree('accueil', 'Accueil')}

        {SECTIONS.map((section) => (
          <details key={section.titre} className="section-menu" open>
            <summary>
              <span aria-hidden>{section.icone}</span> {section.titre}
            </summary>
            <div className="sous-menu">{section.entrees.map(([ecran, nom, detail]) => entree(ecran, nom, detail))}</div>
          </details>
        ))}

        <details className="section-menu">
          <summary>
            <span aria-hidden>?</span> Aide
          </summary>
          <div className="sous-menu">{entree('aide', 'Comment m’utiliser ?', 'Mode d’emploi rubrique par rubrique')}</div>
        </details>

        <details className="section-menu">
          <summary>
            <span aria-hidden>⚙</span> Réglages
          </summary>
          <div className="sous-menu formulaire">
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
            <ReglagesIA />
            <div>
              <span className="libelle">Fiches préparées ({REFERENCES.length})</span>
              <button type="button" className="bouton large" onClick={restaurer}>
                Restaurer les fiches préparées supprimées
              </button>
              {restauration && <p className="discret">{restauration}</p>}
            </div>
          </div>
        </details>

        <details className="section-menu">
          <summary>
            <span aria-hidden>…</span> Bientôt
          </summary>
          <ul className="sous-menu bientot">
            {BIENTOT.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </details>
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
