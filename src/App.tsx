import { useEffect, useState } from 'react';
import { Accueil } from './components/Accueil';
import { Aide } from './components/Aide';
import { FicheOeuvre } from './components/FicheOeuvre';
import { Glossaire } from './components/Glossaire';
import { FormulaireOeuvre } from './components/FormulaireOeuvre';
import { ListeOeuvres } from './components/ListeOeuvres';
import { Revision } from './components/Revision';
import { Logo, Menu } from './components/Menu';
import { aireParId } from './domain/catalogue';
import { creerOeuvre, db, installerReferences, mettreAJourReferences, modifierOeuvre } from './lib/db';
import { telechargerImagesReferences } from './lib/imagesReferences';
import { useReglages } from './lib/reglages';
import { useLive } from './lib/useLive';

type Vue =
  | { type: 'accueil' }
  | { type: 'aide' }
  | { type: 'revision' }
  | { type: 'glossaire' }
  | { type: 'liste'; aireId?: string }
  | { type: 'fiche'; id: string }
  | { type: 'edition'; id?: string };

export function App() {
  const [vue, setVue] = useState<Vue>({ type: 'accueil' });
  const [historique, setHistorique] = useState<Vue[]>([]);
  const [menu, setMenu] = useState(false);
  const [reglages, modifierReglages] = useReglages();
  const enEdition = useLive(async () => (vue.type === 'edition' && vue.id ? db.oeuvres.get(vue.id) : undefined), [vue]);

  // Installe les fiches d'œuvres de référence au premier lancement (et les nouvelles des mises à jour).
  // puis applique les corrections aux fiches non modifiées et télécharge leurs photos en arrière-plan.
  useEffect(() => {
    (async () => {
      await installerReferences();
      await mettreAJourReferences();
      await telechargerImagesReferences();
    })().catch(console.error);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vue]);

  const aller = (v: Vue) => {
    setHistorique((h) => [...h, vue]);
    setVue(v);
  };
  const retour = () => {
    setVue(historique.at(-1) ?? { type: 'accueil' });
    setHistorique((h) => h.slice(0, -1));
  };
  /** Remplace l'écran courant sans l'ajouter à l'historique (après un enregistrement ou une suppression). */
  const remplacer = (v: Vue) => setVue(v);

  const titre =
    vue.type === 'liste'
      ? aireParId(vue.aireId)?.nom ?? 'Œuvres de référence'
      : vue.type === 'glossaire'
        ? 'Glossaire'
        : vue.type === 'revision'
        ? 'Révision'
        : vue.type === 'aide'
        ? 'Comment m’utiliser ?'
        : vue.type === 'edition'
        ? vue.id
          ? 'Modifier la fiche'
          : 'Nouvelle fiche'
        : 'Fiche œuvre';

  return (
    <div className="app">
      <header className="entete">
        {vue.type === 'accueil' ? (
          <Logo />
        ) : (
          <>
            <button className="bouton-icone" onClick={retour} aria-label="Retour">
              ←
            </button>
            <h1 className="titre-ecran">{titre}</h1>
          </>
        )}
        <button className="bouton-menu" onClick={() => setMenu(true)} aria-label="Ouvrir le menu">
          <span />
          <span />
          <span />
        </button>
      </header>

      <main>
        {vue.type === 'accueil' && (
          <Accueil
            reglages={reglages}
            ouvrirAire={(aireId) => aller({ type: 'liste', aireId })}
            ouvrirOeuvre={(id) => aller({ type: 'fiche', id })}
            ouvrirRevision={() => aller({ type: 'revision' })}
            creer={() => aller({ type: 'edition' })}
          />
        )}
        {vue.type === 'aide' && <Aide />}
        {vue.type === 'glossaire' && <Glossaire ouvrirFiche={(id) => aller({ type: 'fiche', id })} reviser={() => aller({ type: 'revision' })} />}
        {vue.type === 'revision' && (
          <Revision
            retourAccueil={() => {
              setHistorique([]);
              setVue({ type: 'accueil' });
            }}
          />
        )}
        {vue.type === 'liste' && (
          <ListeOeuvres key={vue.aireId ?? 'toutes'} aireInitiale={vue.aireId} ouvrir={(id) => aller({ type: 'fiche', id })} creer={() => aller({ type: 'edition' })} />
        )}
        {vue.type === 'fiche' && <FicheOeuvre id={vue.id} retour={retour} modifier={() => aller({ type: 'edition', id: vue.id })} />}
        {vue.type === 'edition' && (!vue.id || enEdition) && (
          <FormulaireOeuvre
            key={vue.id ?? 'nouvelle'}
            initiale={enEdition}
            annuler={retour}
            enregistrer={async (donnees) => {
              if (vue.id) {
                await modifierOeuvre(vue.id, { ...donnees, personnalisee: true });
                retour();
              } else {
                const o = await creerOeuvre(donnees);
                remplacer({ type: 'fiche', id: o.id });
              }
            }}
          />
        )}
      </main>

      {menu && (
        <Menu
          reglages={reglages}
          modifier={modifierReglages}
          fermer={() => setMenu(false)}
          aller={(ecran) => {
            setMenu(false);
            setHistorique([]);
            setVue(ecran === 'accueil' ? { type: 'accueil' } : ecran === 'aide' ? { type: 'aide' } : ecran === 'revision' ? { type: 'revision' } : ecran === 'glossaire' ? { type: 'glossaire' } : { type: 'liste' });
          }}
        />
      )}
    </div>
  );
}
