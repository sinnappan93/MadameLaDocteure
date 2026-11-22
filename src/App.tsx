import { lazy, Suspense, useEffect, useState } from 'react';
import { Accueil } from './components/Accueil';
import { Aide } from './components/Aide';
import { Comparaisons } from './components/Comparaisons';
import { FicheOeuvre } from './components/FicheOeuvre';
import { Glossaire } from './components/Glossaire';
import { FormulaireOeuvre } from './components/FormulaireOeuvre';
import { ListeOeuvres } from './components/ListeOeuvres';
import { type ChoixQuiz, type ModeRevision, Revision } from './components/Revision';
import { Frise } from './components/Frise';
import { Banque } from './components/examen/Banque';
import { CopieDetail } from './components/examen/CopieDetail';
import { Copies } from './components/examen/Copies';
import { Ecriture } from './components/examen/Ecriture';
import { SujetBlanc } from './components/examen/SujetBlanc';
import { EpreuveOrale } from './components/oral/EpreuveOrale';
import { OralDetail } from './components/oral/OralDetail';
import { Simulateur } from './components/oral/Simulateur';
import { Bibliographie } from './components/preparation/Bibliographie';
import { LectureDetail } from './components/preparation/LectureDetail';
import { PlanRevision } from './components/preparation/PlanRevision';
import { nouvelleVisite, VisiteDetail, Visites } from './components/preparation/Visites';
import type { TypeEpreuve } from './data/sujets';
import type { Seance } from './domain/plan';

const CarteSites = lazy(() => import('./components/carte/CarteSites'));
import { type EcranMenu, Logo, Menu } from './components/Menu';
import { aireParId } from './domain/catalogue';
import { creerOeuvre, creerVisite, db, installerReferences, mettreAJourReferences, modifierOeuvre } from './lib/db';
import { telechargerImagesReferences } from './lib/imagesReferences';
import { useReglages } from './lib/reglages';
import { useLive } from './lib/useLive';

type Vue =
  | { type: 'accueil' }
  | { type: 'aide' }
  | { type: 'revision'; mode?: ModeRevision; quiz?: ChoixQuiz; aireId?: string }
  | { type: 'plan' }
  | { type: 'biblio' }
  | { type: 'lecture'; id: string }
  | { type: 'visites' }
  | { type: 'visite'; id: string }
  | { type: 'frise' }
  | { type: 'examen-blanc'; sujetId?: string; epreuve?: TypeEpreuve }
  | { type: 'examen-plan' }
  | { type: 'examen-copies' }
  | { type: 'examen-banque' }
  | { type: 'ecriture'; id: string }
  | { type: 'copie'; id: string }
  | { type: 'oral' }
  | { type: 'oral-epreuve'; id: string }
  | { type: 'oral-detail'; id: string }
  | { type: 'carte' }
  | { type: 'glossaire' }
  | { type: 'comparaisons' }
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

  /** Ouvre l'écran qui correspond à une séance du plan. */
  const lancerSeance = async (s: Seance) => {
    switch (s.type) {
      case 'identifier':
        return aller({ type: 'revision', mode: 'oeuvres', aireId: s.aireId });
      case 'glossaire':
        return aller({ type: 'revision', mode: 'glossaire' });
      case 'anglais':
        return aller({ type: 'revision', mode: 'anglais' });
      case 'comparer':
        return aller({ type: 'revision', mode: 'comparaisons' });
      case 'reperes':
        return aller({ type: 'revision', mode: 'quiz', quiz: 'reperes' });
      case 'lecture':
        return aller(s.lectureId ? { type: 'lecture', id: s.lectureId } : { type: 'biblio' });
      case 'fiches':
        return aller({ type: 'liste', aireId: s.aireId });
      case 'plan15':
        return aller({ type: 'examen-plan' });
      case 'sujet-blanc':
        return aller({ type: 'examen-blanc', epreuve: s.epreuve });
      case 'oral':
      case 'situations':
        return aller({ type: 'oral' });
      case 'visite': {
        const v = await creerVisite(nouvelleVisite(s.sections, s.id));
        return aller({ type: 'visite', id: v.id });
      }
    }
  };

  const titre =
    vue.type === 'liste'
      ? aireParId(vue.aireId)?.nom ?? 'Œuvres de référence'
      : vue.type === 'examen-blanc'
        ? 'Sujet blanc'
        : vue.type === 'examen-plan'
          ? 'Plan en 15 minutes'
          : vue.type === 'examen-copies'
            ? 'Mes copies'
            : vue.type === 'examen-banque'
              ? 'Banque de sujets'
              : vue.type === 'ecriture'
                ? 'Épreuve en cours'
                : vue.type === 'copie'
                  ? 'Copie'
                  : vue.type === 'plan'
                  ? 'Plan de révision'
                  : vue.type === 'biblio'
                  ? 'Bibliographie'
                  : vue.type === 'lecture'
                  ? 'Lecture'
                  : vue.type === 'visites'
                  ? 'Journal de visites'
                  : vue.type === 'visite'
                  ? 'Visite'
                  : vue.type === 'oral'
                  ? 'Simulateur d’oral'
                  : vue.type === 'oral-epreuve'
                  ? 'Oral en cours'
                  : vue.type === 'oral-detail'
                  ? 'Oral blanc'
                  : vue.type === 'frise'
        ? 'Frise chronologique'
        : vue.type === 'carte'
          ? 'Carte des sites'
          : vue.type === 'comparaisons'
        ? 'Comparaisons'
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
            ouvrirPlan={() => aller({ type: 'plan' })}
            lancerSeance={lancerSeance}
            creer={() => aller({ type: 'edition' })}
          />
        )}
        {vue.type === 'aide' && <Aide />}
        {vue.type === 'examen-blanc' && <SujetBlanc key={vue.sujetId ?? vue.epreuve ?? 'hasard'} sujetInitial={vue.sujetId} typeInitial={vue.epreuve} commencer={(id) => remplacer({ type: 'ecriture', id })} />}
        {vue.type === 'examen-plan' && <SujetBlanc plan commencer={(id) => remplacer({ type: 'ecriture', id })} />}
        {vue.type === 'examen-banque' && <Banque sEntrainer={(sujetId) => aller({ type: 'examen-blanc', sujetId })} />}
        {vue.type === 'examen-copies' && <Copies ouvrir={(id) => aller({ type: 'copie', id })} reprendre={(id) => aller({ type: 'ecriture', id })} />}
        {vue.type === 'ecriture' && <Ecriture id={vue.id} rendue={(id) => remplacer({ type: 'copie', id })} />}
        {vue.type === 'copie' && <CopieDetail id={vue.id} retour={retour} />}
        {vue.type === 'plan' && <PlanRevision reglages={reglages} modifierReglages={modifierReglages} lancer={lancerSeance} />}
        {vue.type === 'biblio' && <Bibliographie ouvrir={(id) => aller({ type: 'lecture', id })} />}
        {vue.type === 'lecture' && <LectureDetail key={vue.id} id={vue.id} retour={retour} ouvrirFiche={(id) => aller({ type: 'fiche', id })} />}
        {vue.type === 'visites' && (
          <Visites
            ouvrir={(id) => aller({ type: 'visite', id })}
            nouvelle={async (sections, seanceId) => {
              const v = await creerVisite(nouvelleVisite(sections, seanceId));
              aller({ type: 'visite', id: v.id });
            }}
          />
        )}
        {vue.type === 'visite' && <VisiteDetail key={vue.id} id={vue.id} retour={retour} ouvrirFiche={(id) => aller({ type: 'fiche', id })} />}
        {vue.type === 'oral' && (
          <Simulateur commencer={(id) => aller({ type: 'oral-epreuve', id })} ouvrir={(o) => aller(o.phase === 'termine' ? { type: 'oral-detail', id: o.id } : { type: 'oral-epreuve', id: o.id })} />
        )}
        {vue.type === 'oral-epreuve' && <EpreuveOrale id={vue.id} terminee={(id) => remplacer({ type: 'oral-detail', id })} />}
        {vue.type === 'oral-detail' && <OralDetail id={vue.id} retour={retour} ouvrirFiche={(id) => aller({ type: 'fiche', id })} />}
        {vue.type === 'frise' && <Frise ouvrirFiche={(id) => aller({ type: 'fiche', id })} />}
        {vue.type === 'carte' && (
          <Suspense fallback={<section className="panneau"><p className="discret">Chargement de la carte…</p></section>}>
            <CarteSites ouvrirFiche={(id) => aller({ type: 'fiche', id })} />
          </Suspense>
        )}
        {vue.type === 'comparaisons' && <Comparaisons ouvrirFiche={(id) => aller({ type: 'fiche', id })} reviser={() => aller({ type: 'revision', mode: 'comparaisons' })} />}
        {vue.type === 'glossaire' && <Glossaire ouvrirFiche={(id) => aller({ type: 'fiche', id })} reviser={() => aller({ type: 'revision', mode: 'glossaire' })} />}
        {vue.type === 'revision' && (
          <Revision
            key={`${vue.mode ?? 'oeuvres'}-${vue.quiz ?? ''}-${vue.aireId ?? ''}`}
            modeInitial={vue.mode}
            quizInitial={vue.quiz}
            aireInitiale={vue.aireId}
            retourAccueil={() => {
              setHistorique([]);
              setVue({ type: 'accueil' });
            }}
          />
        )}
        {vue.type === 'liste' && (
          <ListeOeuvres key={vue.aireId ?? 'toutes'} aireInitiale={vue.aireId} ouvrir={(id) => aller({ type: 'fiche', id })} creer={() => aller({ type: 'edition' })} />
        )}
        {vue.type === 'fiche' && <FicheOeuvre
            key={vue.id}
            id={vue.id}
            retour={retour}
            modifier={() => aller({ type: 'edition', id: vue.id })}
            ouvrirFiche={(id) => aller({ type: 'fiche', id })}
            ouvrirLecture={(id) => aller({ type: 'lecture', id })}
            ouvrirVisite={(id) => aller({ type: 'visite', id })}
          />}
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
          actuel={ecranDuMenu(vue)}
          aller={(ecran) => {
            setMenu(false);
            setHistorique([]);
            setVue(vueDuMenu(ecran));
          }}
        />
      )}
    </div>
  );
}

/** Écran du menu correspondant à la vue affichée (pour le mettre en évidence). */
function ecranDuMenu(vue: Vue): EcranMenu | undefined {
  switch (vue.type) {
    case 'accueil':
    case 'aide':
    case 'glossaire':
    case 'comparaisons':
    case 'frise':
    case 'carte':
    case 'examen-blanc':
    case 'examen-plan':
    case 'examen-copies':
    case 'examen-banque':
    case 'oral':
    case 'plan':
    case 'biblio':
    case 'visites':
      return vue.type;
    case 'lecture':
      return 'biblio';
    case 'visite':
      return 'visites';
    case 'oral-epreuve':
    case 'oral-detail':
      return 'oral';
    case 'ecriture':
    case 'copie':
      return 'examen-copies';
    case 'revision':
      return vue.mode === 'quiz' && vue.quiz === 'reperes' ? 'revision-reperes' : `revision-${vue.mode ?? 'oeuvres'}`;
    default:
      return 'oeuvres';
  }
}

function vueDuMenu(ecran: EcranMenu): Vue {
  switch (ecran) {
    case 'revision-oeuvres':
      return { type: 'revision', mode: 'oeuvres' };
    case 'revision-comparaisons':
      return { type: 'revision', mode: 'comparaisons' };
    case 'revision-glossaire':
      return { type: 'revision', mode: 'glossaire' };
    case 'revision-quiz':
      return { type: 'revision', mode: 'quiz' };
    case 'revision-reperes':
      return { type: 'revision', mode: 'quiz', quiz: 'reperes' };
    case 'revision-anglais':
      return { type: 'revision', mode: 'anglais' };
    case 'oeuvres':
      return { type: 'liste' };
    default:
      return { type: ecran };
  }
}
