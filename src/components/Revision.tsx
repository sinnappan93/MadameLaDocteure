import { useMemo, useState } from 'react';
import { AIRES, aireParId, formatAnnee, periodeParId } from '../domain/catalogue';
import { apercuIntervalles, bilan, type Carte, composerSeance, type Note, optionsPeriode, SEUIL_MAITRISE } from '../domain/revision';
import type { Oeuvre } from '../domain/types';
import { db, enregistrerReponse } from '../lib/db';
import { useLive } from '../lib/useLive';
import { Bloc } from './Bloc';
import { Vignette } from './Vignette';

type Etape = { nom: 'depart' } | { nom: 'seance'; cartes: Carte[]; index: number; resultats: Resultat[]; repassees: Record<string, number> } | { nom: 'fin'; resultats: Resultat[] };

interface Resultat {
  carte: Carte;
  note: Note;
}

const MAXIMUM = 30;

export function Revision({ retourAccueil }: { retourAccueil: () => void }) {
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const etats = useLive(() => db.revisions.toArray(), []);
  const [etape, setEtape] = useState<Etape>({ nom: 'depart' });
  const [aire, setAire] = useState('');
  const [nouvelles, setNouvelles] = useState(10);

  if (!oeuvres || !etats) return <section className="panneau" />;
  const parId = new Map(oeuvres.map((o) => [o.id, o]));

  const demarrer = () => {
    const cartes = composerSeance(oeuvres, etats, { maintenant: new Date(), nouvelles, maximum: MAXIMUM, aireId: aire || undefined });
    if (cartes.length) setEtape({ nom: 'seance', cartes, index: 0, resultats: [], repassees: {} });
  };

  if (etape.nom === 'depart') {
    const b = bilan(aire ? oeuvres.filter((o) => o.aireId === aire) : oeuvres, etats, new Date());
    const apercu = composerSeance(oeuvres, etats, { maintenant: new Date(), nouvelles, maximum: MAXIMUM, aireId: aire || undefined, hasard: () => 0 });
    return (
      <section className="panneau revision">
        <div className="stats-revision">
          <Stat valeur={b.dues} libelle="à revoir aujourd’hui" />
          <Stat valeur={b.nouvelles} libelle="œuvres jamais révisées" />
          <Stat valeur={b.maitrisees} libelle="œuvres maîtrisées" />
        </div>
        <p className="discret">
          L’appli te montre la photo d’une œuvre : retrouve son titre, sa datation et son lieu, puis vérifie. Plus tu réussis une œuvre, plus elle revient tard
          (maîtrisée au-delà de {SEUIL_MAITRISE} jours).
        </p>
        <div className="formulaire">
          <label>
            Aire
            <select value={aire} onChange={(e) => setAire(e.target.value)}>
              <option value="">Toutes les aires</option>
              {AIRES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="libelle">Nouvelles œuvres par séance</span>
            <div className="onglets" role="radiogroup" aria-label="Nouvelles œuvres par séance">
              {[0, 5, 10, 20].map((n) => (
                <button key={n} role="radio" aria-checked={nouvelles === n} className={nouvelles === n ? 'actif' : ''} onClick={() => setNouvelles(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        {apercu.length > 0 ? (
          <button className="bouton principal large grand" onClick={demarrer}>
            Commencer · {apercu.length} carte{apercu.length > 1 ? 's' : ''}
          </button>
        ) : (
          <p className="vide-etat">{b.dues + b.nouvelles === 0 ? 'Rien à réviser pour aujourd’hui. Reviens demain !' : 'Choisis au moins une nouvelle œuvre par séance.'}</p>
        )}
        {b.sansImage > 0 && (
          <p className="discret">
            {b.sansImage} fiche{b.sansImage > 1 ? 's' : ''} sans image n’{b.sansImage > 1 ? 'apparaissent' : 'apparaît'} pas dans la révision : ajoute une image pour
            {b.sansImage > 1 ? ' les' : ' l’'} inclure.
          </p>
        )}
      </section>
    );
  }

  if (etape.nom === 'fin') {
    const reussies = etape.resultats.filter((r) => r.note >= 2).length;
    const uniques = new Set(etape.resultats.map((r) => r.carte.id)).size;
    return (
      <section className="panneau revision">
        <div className="fin-seance">
          <p className="fin-titre">Séance terminée</p>
          <div className="stats-revision">
            <Stat valeur={uniques} libelle="cartes révisées" />
            <Stat valeur={`${Math.round((reussies / Math.max(1, etape.resultats.length)) * 100)} %`} libelle="de bonnes réponses" />
          </div>
          <ul className="liste-fin">
            {etape.resultats.map((r, i) => {
              const o = parId.get(r.carte.oeuvreId);
              return (
                <li key={i} className={r.note === 0 ? 'rate' : 'reussi'}>
                  <span aria-hidden>{r.note === 0 ? '✗' : '✓'}</span> {o?.titre}
                  <span className="discret"> · {r.carte.type === 'periode' ? 'période' : 'identification'}</span>
                </li>
              );
            })}
          </ul>
          <div className="actions">
            <button className="bouton" onClick={retourAccueil}>
              Accueil
            </button>
            <button className="bouton principal" onClick={() => setEtape({ nom: 'depart' })}>
              Nouvelle séance
            </button>
          </div>
        </div>
      </section>
    );
  }

  const carte = etape.cartes[etape.index];
  const oeuvre = parId.get(carte.oeuvreId);
  const repondre = async (note: Note) => {
    await enregistrerReponse(carte, note);
    const resultats = [...etape.resultats, { carte, note }];
    let cartes = etape.cartes;
    const repassees = { ...etape.repassees };
    // Une carte ratée repasse en fin de séance (deux fois au plus).
    if (note === 0 && (repassees[carte.id] ?? 0) < 2) {
      repassees[carte.id] = (repassees[carte.id] ?? 0) + 1;
      cartes = [...cartes, { ...carte, etat: await db.revisions.get(carte.id) }];
    }
    const index = etape.index + 1;
    setEtape(index < cartes.length ? { nom: 'seance', cartes, index, resultats, repassees } : { nom: 'fin', resultats });
  };

  return (
    <section className="panneau revision">
      <div className="progression-seance" aria-label={`Carte ${etape.index + 1} sur ${etape.cartes.length}`}>
        <span className="barre">
          <span style={{ width: `${(etape.index / etape.cartes.length) * 100}%` }} />
        </span>
        <span className="discret">
          {etape.index + 1} / {etape.cartes.length}
        </span>
        <button className="lien" onClick={() => setEtape(etape.resultats.length ? { nom: 'fin', resultats: etape.resultats } : { nom: 'depart' })}>
          Arrêter
        </button>
      </div>
      {oeuvre ? (
        carte.type === 'identifier' ? (
          <CarteIdentifier key={`${carte.id}-${etape.index}`} carte={carte} oeuvre={oeuvre} repondre={repondre} />
        ) : (
          <CartePeriode key={`${carte.id}-${etape.index}`} oeuvre={oeuvre} repondre={repondre} />
        )
      ) : (
        <button className="bouton large" onClick={() => repondre(2)}>
          Fiche supprimée, passer
        </button>
      )}
    </section>
  );
}

function Stat({ valeur, libelle }: { valeur: number | string; libelle: string }) {
  return (
    <div className="stat">
      <span className="stat-valeur">{valeur}</span>
      <span className="stat-libelle">{libelle}</span>
    </div>
  );
}

function ImageQuestion({ oeuvre }: { oeuvre: Oeuvre }) {
  // Ni titre ni crédits sous l'image : ils donneraient la réponse.
  return <Vignette imageId={oeuvre.imagePrincipaleId} alt="Œuvre à identifier" className="grande image-question" />;
}

function CarteIdentifier({ carte, oeuvre, repondre }: { carte: Carte; oeuvre: Oeuvre; repondre: (n: Note) => void }) {
  const [revelee, setRevelee] = useState(false);
  const intervalles = useMemo(() => apercuIntervalles(carte.etat, carte, new Date()), [carte]);
  const notes: Array<[Note, string, string]> = [
    [0, 'À revoir', 'note-0'],
    [1, 'Difficile', 'note-1'],
    [2, 'Bien', 'note-2'],
    [3, 'Facile', 'note-3'],
  ];
  return (
    <div className="carte-question">
      <ImageQuestion oeuvre={oeuvre} />
      <p className="consigne">Identifie cette œuvre : titre, datation, lieu, style.</p>
      {!revelee ? (
        <button className="bouton principal large grand" onClick={() => setRevelee(true)}>
          Voir la réponse
        </button>
      ) : (
        <>
          <Reponse oeuvre={oeuvre} />
          <p className="discret centre">As-tu retrouvé l’essentiel ?</p>
          <div className="notes">
            {notes.map(([n, libelle, classe]) => (
              <button key={n} className={`note ${classe}`} onClick={() => repondre(n)}>
                <span>{libelle}</span>
                <span className="note-delai">{intervalles[n]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CartePeriode({ oeuvre, repondre }: { oeuvre: Oeuvre; repondre: (n: Note) => void }) {
  const options = useMemo(() => optionsPeriode(oeuvre.periodeId!), [oeuvre.periodeId]);
  const [choix, setChoix] = useState<string>();
  const juste = choix === oeuvre.periodeId;
  return (
    <div className="carte-question">
      <ImageQuestion oeuvre={oeuvre} />
      <p className="consigne">À quelle période appartient cette œuvre ?</p>
      <div className="qcm">
        {options.map((id) => {
          const p = periodeParId(id)!;
          const etat = !choix ? '' : id === oeuvre.periodeId ? 'juste' : id === choix ? 'faux' : 'neutre';
          return (
            <button key={id} className={`option ${etat}`} disabled={!!choix} onClick={() => setChoix(id)}>
              <span className="option-nom">{p.nom}</span>
              <span className="discret">
                {aireParId(p.aireId)?.nom} · {formatAnnee(p.debut)} – {formatAnnee(p.fin)}
              </span>
            </button>
          );
        })}
      </div>
      {choix && (
        <>
          <p className={`verdict ${juste ? 'juste' : 'faux'}`}>{juste ? 'Bonne réponse !' : 'Ce n’est pas la bonne période.'}</p>
          <Reponse oeuvre={oeuvre} />
          <button className="bouton principal large grand" onClick={() => repondre(juste ? 2 : 0)}>
            Continuer
          </button>
        </>
      )}
    </div>
  );
}

function Reponse({ oeuvre: o }: { oeuvre: Oeuvre }) {
  const lignes: Array<[string, string | undefined]> = [
    ['Période', [periodeParId(o.periodeId)?.nom, aireParId(o.aireId)?.nom].filter(Boolean).join(' · ')],
    ['Datation', o.datation],
    ['Site', o.site],
    ['Matériau', o.materiau],
    ['Conservation', o.conservation],
    ['Style', o.style],
  ];
  return (
    <div className="reponse">
      <h2>{o.titre}</h2>
      <dl className="proprietes">
        {lignes
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {(o.iconographie || o.notes) && (
        <details className="details-reponse">
          <summary>Iconographie et points à retenir</summary>
          {o.iconographie && <Bloc titre="Iconographie" texte={o.iconographie} />}
          {o.notes && <Bloc titre="Points à retenir" texte={o.notes} />}
        </details>
      )}
    </div>
  );
}
