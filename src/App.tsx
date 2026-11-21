import { useEffect, useState } from 'react';
import { Accueil } from './components/Accueil';
import { FicheOeuvre } from './components/FicheOeuvre';
import { FormulaireOeuvre } from './components/FormulaireOeuvre';
import { ListeOeuvres } from './components/ListeOeuvres';
import { Logo, Menu } from './components/Menu';
import { aireParId } from './domain/catalogue';
import { creerOeuvre, db, installerReferences, modifierOeuvre } from './lib/db';
import { useReglages } from './lib/reglages';
import { useLive } from './lib/useLive';

type Vue =
  | { type: 'accueil' }
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
  useEffect(() => {
    installerReferences().catch(console.error);
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
            creer={() => aller({ type: 'edition' })}
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
                await modifierOeuvre(vue.id, donnees);
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
            setVue(ecran === 'accueil' ? { type: 'accueil' } : { type: 'liste' });
          }}
        />
      )}
    </div>
  );
}
