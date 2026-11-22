import { AIRES, aireParId, periodeParId } from '../domain/catalogue';
import { completude, couverture, joursAvant } from '../domain/progression';
import { GLOSSAIRE } from '../data/glossaire';
import { bilanGlossaire } from '../domain/glossaire';
import { bilan } from '../domain/revision';
import { db } from '../lib/db';
import type { Reglages } from '../lib/reglages';
import { useLive } from '../lib/useLive';
import { Illustration } from './Illustration';
import type { Seance } from '../domain/plan';
import { Aujourdhui } from './preparation/Aujourdhui';
import { Vignette } from './Vignette';

interface Props {
  reglages: Reglages;
  ouvrirAire: (aireId?: string) => void;
  ouvrirOeuvre: (id: string) => void;
  creer: () => void;
  ouvrirRevision: () => void;
  ouvrirPlan: () => void;
  lancerSeance: (s: Seance) => void;
}

export function Accueil({ reglages, ouvrirAire, ouvrirOeuvre, creer, ouvrirRevision, ouvrirPlan, lancerSeance }: Props) {
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const etats = useLive(() => db.revisions.toArray(), []);
  const revision = oeuvres && etats ? bilan(oeuvres, etats, new Date()) : undefined;
  const glossaire = etats ? bilanGlossaire(GLOSSAIRE, etats, new Date()) : undefined;
  const dues = (revision?.dues ?? 0) + (glossaire?.dues ?? 0);
  const recentes = [...(oeuvres ?? [])].sort((a, b) => b.modifieeLe.localeCompare(a.modifieeLe)).slice(0, 3);
  const jours = joursAvant(reglages.dateEcrits);
  const total = couverture(oeuvres ?? []);

  return (
    <>
      <section className="hero">
        <div>
          <h1>Bonjour {reglages.prenom || 'Docteure'}</h1>
          <p className="sous-titre">Prête à réviser ?</p>
          <p className="compte-a-rebours">
            <strong>J-{jours}</strong> avant les écrits
          </p>
        </div>
        <Illustration />
      </section>

      <section className="panneau">
        <Aujourdhui ouvrirPlan={ouvrirPlan} lancer={lancerSeance} />
        {revision && dues + revision.nouvelles + (glossaire?.nouveaux ?? 0) > 0 && (
          <button className="carte-du-jour" onClick={ouvrirRevision}>
            <span>
              <span className="carte-du-jour-titre">Révision du jour</span>
              <span className="carte-du-jour-detail">
                {dues > 0 ? `${dues} carte${dues > 1 ? 's' : ''} à revoir` : 'Tout est à jour'}
                {revision.nouvelles > 0 && ` · ${revision.nouvelles} œuvre${revision.nouvelles > 1 ? 's' : ''} à découvrir`}
              </span>
              {revision.maitrisees > 0 && <span className="carte-du-jour-detail">{revision.maitrisees} œuvre{revision.maitrisees > 1 ? 's' : ''} maîtrisée{revision.maitrisees > 1 ? 's' : ''}</span>}
            </span>
            <span className="carte-du-jour-bouton">Réviser</span>
          </button>
        )}
        <div className="titre-section">
          <h2>Toutes les aires</h2>
          <button className="lien" onClick={() => ouvrirAire()}>
            Tout voir
          </button>
        </div>
        <div className="tuiles" role="list">
          {AIRES.map((a, i) => {
            const n = oeuvres?.filter((o) => o.aireId === a.id).length ?? 0;
            return (
              <button key={a.id} role="listitem" className={`tuile t${i % 10}`} onClick={() => ouvrirAire(a.id)}>
                <span className="tuile-nom">{a.nom}</span>
                <span className="tuile-compte">{n === 0 ? 'à commencer' : `${n} fiche${n > 1 ? 's' : ''}`}</span>
              </button>
            );
          })}
        </div>

        <div className="titre-section">
          <h2>Tes dernières fiches</h2>
        </div>
        {oeuvres && recentes.length === 0 && (
          <button className="carte-revision invitation" onClick={creer}>
            <span>
              <span className="carte-revision-titre">Crée ta première fiche d’œuvre</span>
              <span className="discret">Le Bouddha de Sarnath, un Naṭarāja chola, un linteau khmer du Guimet…</span>
            </span>
            <span className="plus-rond" aria-hidden>
              +
            </span>
          </button>
        )}
        {recentes.map((o) => {
          const pct = Math.round(completude(o) * 100);
          return (
            <button key={o.id} className="carte-revision" onClick={() => ouvrirOeuvre(o.id)}>
              <span className="carte-revision-texte">
                <span className="carte-revision-titre">{o.titre}</span>
                <span className="discret">{[aireParId(o.aireId)?.nom, periodeParId(o.periodeId)?.nom].filter(Boolean).join(' · ') || 'À classer'}</span>
                <span className="progression-libelle">{pct} % de la fiche complétée</span>
                <span className="barre">
                  <span style={{ width: `${pct}%` }} />
                </span>
              </span>
              <Vignette imageId={o.imagePrincipaleId} alt="" className="carte-revision-image" />
            </button>
          );
        })}

        <div className="carte-revision statique">
          <span className="carte-revision-texte">
            <span className="carte-revision-titre">Couverture du programme</span>
            <span className="progression-libelle">
              {total.couvertes} période{total.couvertes > 1 ? 's' : ''} sur {total.total} avec au moins une fiche
            </span>
            <span className="barre">
              <span style={{ width: `${(total.couvertes / total.total) * 100}%` }} />
            </span>
          </span>
        </div>
      </section>
    </>
  );
}
