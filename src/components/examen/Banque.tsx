import { useState } from 'react';
import { type TypeEpreuve, TYPES_EPREUVE } from '../../data/sujets';
import { NOMS_SOURCES, type SourceSujet } from '../../domain/examen';
import { ajouterSujet, db } from '../../lib/db';
import { expliquerErreur, genererSujets, iaPrete } from '../../lib/ia';
import { ChoixType, useSujets } from './communs';

/** Banque de sujets : proposés, tirés des rapports de jury, ajoutés à la main ou générés par l'IA. */
export function Banque({ sEntrainer }: { sEntrainer: (sujetId: string) => void }) {
  const sujets = useSujets();
  const [type, setType] = useState<TypeEpreuve>('specialite');
  const [ajout, setAjout] = useState(false);
  const [intitule, setIntitule] = useState('');
  const [source, setSource] = useState<SourceSujet>('jury');
  const [precision, setPrecision] = useState('');
  const [theme, setTheme] = useState('');
  const [generation, setGeneration] = useState<{ etat: 'repos' | 'en-cours' | 'erreur'; message?: string; sujets?: string[] }>({ etat: 'repos' });

  const visibles = (sujets ?? []).filter((s) => s.type === type);

  const enregistrer = async () => {
    if (!intitule.trim()) return;
    await ajouterSujet({ type, intitule: intitule.trim(), source, precision: precision.trim() || undefined });
    setIntitule('');
    setPrecision('');
    setAjout(false);
  };

  const generer = async () => {
    setGeneration({ etat: 'en-cours' });
    try {
      setGeneration({ etat: 'repos', sujets: await genererSujets(type, theme) });
    } catch (e) {
      setGeneration({ etat: 'erreur', message: await expliquerErreur(e) });
    }
  };

  return (
    <section className="panneau examen">
      <ChoixType valeur={type} changer={(t) => { setType(t); setGeneration({ etat: 'repos' }); }} />
      <p className="discret">{TYPES_EPREUVE.find((t) => t.id === type)?.description}</p>

      <div className="actions-banque">
        <button className="bouton" onClick={() => setAjout((v) => !v)}>
          {ajout ? 'Annuler' : '+ Ajouter un sujet'}
        </button>
      </div>
      {ajout && (
        <div className="formulaire bloc">
          <label>
            Intitulé
            <textarea rows={2} value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Recopie l’intitulé exact" />
          </label>
          <div className="deux-colonnes">
            <label>
              Source
              <select value={source} onChange={(e) => setSource(e.target.value as SourceSujet)}>
                <option value="jury">Rapport de jury</option>
                <option value="perso">Autre (cours, prépa…)</option>
              </select>
            </label>
            <label>
              Précision
              <input value={precision} onChange={(e) => setPrecision(e.target.value)} placeholder="Session 2022…" />
            </label>
          </div>
          <button className="bouton principal" disabled={!intitule.trim()} onClick={enregistrer}>
            Enregistrer le sujet
          </button>
        </div>
      )}

      <details className="bloc generation">
        <summary>Générer des sujets avec l’IA</summary>
        {!iaPrete() && <p className="discret">À activer d’abord dans Menu › Réglages › Intelligence artificielle.</p>}
        <div className="barre-recherche">
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Thème facultatif : art khmer, musées, bronzes…" />
          <button className="bouton principal" disabled={!iaPrete() || generation.etat === 'en-cours'} onClick={generer}>
            {generation.etat === 'en-cours' ? 'Génération…' : 'Générer'}
          </button>
        </div>
        {generation.etat === 'erreur' && <p className="erreur">{generation.message}</p>}
        {generation.sujets?.map((s) => (
          <div key={s} className="sujet-genere">
            <span>{s}</span>
            <button
              className="lien"
              onClick={async () => {
                await ajouterSujet({ type, intitule: s, source: 'ia' });
                setGeneration((g) => ({ ...g, sujets: g.sujets?.filter((x) => x !== s) }));
              }}
            >
              Garder
            </button>
          </div>
        ))}
      </details>

      <p className="discret compteur">{visibles.length} sujet(s)</p>
      <ul className="liste-sujets">
        {visibles.map((s) => (
          <li key={s.id} className="sujet">
            <span className="sujet-intitule">{s.intitule}</span>
            <span className="discret">
              {NOMS_SOURCES[s.source]}
              {s.precision ? ` · ${s.precision}` : ''}
            </span>
            <span className="sujet-actions">
              <button className="lien" onClick={() => sEntrainer(s.id)}>
                S’entraîner
              </button>
              {s.source !== 'propose' && (
                <button className="lien danger" onClick={() => confirm('Supprimer ce sujet de la banque ?') && db.sujets.delete(s.id)}>
                  Supprimer
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
