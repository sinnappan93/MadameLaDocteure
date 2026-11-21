import { useMemo, useState } from 'react';
import { CATEGORIES_GLOSSAIRE, type CategorieGlossaire, GLOSSAIRE, type Terme } from '../data/glossaire';
import { bilanGlossaire, composerSeanceGlossaire, optionsTermes, termeParId } from '../domain/glossaire';
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
  const [mode, setMode] = useState<'oeuvres' | 'glossaire'>('oeuvres');
  const [categorie, setCategorie] = useState<CategorieGlossaire | ''>('');

  if (!oeuvres || !etats) return <section className="panneau" />;
  const parId = new Map(oeuvres.map((o) => [o.id, o]));

  const composerCartes = (hasard?: () => number) =>
    mode === 'oeuvres'
      ? composerSeance(oeuvres, etats, { maintenant: new Date(), nouvelles, maximum: MAXIMUM, aireId: aire || undefined, hasard })
      : composerSeanceGlossaire(GLOSSAIRE, etats, { maintenant: new Date(), nouvelles, maximum: MAXIMUM, categorie: categorie || undefined, hasard });

  const demarrer = () => {
    const cartes = composerCartes();
    if (cartes.length) setEtape({ nom: 'seance', cartes, index: 0, resultats: [], repassees: {} });
  };

  const choixMode = (
    <div className="onglets" role="tablist" aria-label="Que réviser ?">
      <button role="tab" aria-selected={mode === 'oeuvres'} className={mode === 'oeuvres' ? 'actif' : ''} onClick={() => setMode('oeuvres')}>
        Œuvres
      </button>
      <button role="tab" aria-selected={mode === 'glossaire'} className={mode === 'glossaire' ? 'actif' : ''} onClick={() => setMode('glossaire')}>
        Glossaire
      </button>
    </div>
  );

  const choixNouvelles = (
    <div>
      <span className="libelle">{mode === 'oeuvres' ? 'Nouvelles œuvres par séance' : 'Nouveaux termes par séance'}</span>
      <div className="onglets" role="radiogroup" aria-label="Nouveautés par séance">
        {[0, 5, 10, 20].map((n) => (
          <button key={n} role="radio" aria-checked={nouvelles === n} className={nouvelles === n ? 'actif' : ''} onClick={() => setNouvelles(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  if (etape.nom === 'depart' && mode === 'glossaire') {
    const termes = categorie ? GLOSSAIRE.filter((t) => t.categorie === categorie) : GLOSSAIRE;
    const b = bilanGlossaire(termes, etats, new Date());
    const apercu = composerCartes(() => 0);
    return (
      <section className="panneau revision">
        {choixMode}
        <div className="stats-revision">
          <Stat valeur={b.dues} libelle="à revoir aujourd’hui" />
          <Stat valeur={b.nouveaux} libelle="termes jamais révisés" />
          <Stat valeur={b.maitrises} libelle="termes maîtrisés" />
        </div>
        <p className="discret">
          Gestes, postures, attributs, divinités, montures, architecture : retrouve la définition d’un terme, puis, les jours suivants, le terme qui correspond à une
          définition.
        </p>
        <div className="formulaire">
          <label>
            Catégorie
            <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieGlossaire | '')}>
              <option value="">Tout le glossaire ({GLOSSAIRE.length} termes)</option>
              {CATEGORIES_GLOSSAIRE.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
          {choixNouvelles}
        </div>
        {apercu.length > 0 ? (
          <button className="bouton principal large grand" onClick={demarrer}>
            Commencer · {apercu.length} carte{apercu.length > 1 ? 's' : ''}
          </button>
        ) : (
          <p className="vide-etat">{b.dues + b.nouveaux === 0 ? 'Rien à réviser pour aujourd’hui. Reviens demain !' : 'Choisis au moins un nouveau terme par séance.'}</p>
        )}
      </section>
    );
  }

  if (etape.nom === 'depart') {
    const b = bilan(aire ? oeuvres.filter((o) => o.aireId === aire) : oeuvres, etats, new Date());
    const apercu = composerCartes(() => 0);
    return (
      <section className="panneau revision">
        {choixMode}
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
          {choixNouvelles}
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
              const nom = parId.get(r.carte.oeuvreId)?.titre ?? termeParId(r.carte.oeuvreId)?.terme;
              const libelle = { identifier: 'identification', periode: 'période', terme: 'définition', definition: 'terme' }[r.carte.type];
              return (
                <li key={i} className={r.note === 0 ? 'rate' : 'reussi'}>
                  <span aria-hidden>{r.note === 0 ? '✗' : '✓'}</span> {nom}
                  <span className="discret"> · {libelle}</span>
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
  const terme = termeParId(carte.oeuvreId);
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
      {terme ? (
        carte.type === 'terme' ? (
          <CarteTerme key={`${carte.id}-${etape.index}`} carte={carte} terme={terme} repondre={repondre} />
        ) : (
          <CarteDefinition key={`${carte.id}-${etape.index}`} terme={terme} repondre={repondre} />
        )
      ) : oeuvre ? (
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

const NOMS_CATEGORIES = Object.fromEntries(CATEGORIES_GLOSSAIRE.map((c) => [c.id, c.nom]));

function BoutonsNotes({ carte, repondre }: { carte: Carte; repondre: (n: Note) => void }) {
  const intervalles = useMemo(() => apercuIntervalles(carte.etat, carte, new Date()), [carte]);
  const notes: Array<[Note, string]> = [
    [0, 'À revoir'],
    [1, 'Difficile'],
    [2, 'Bien'],
    [3, 'Facile'],
  ];
  return (
    <div className="notes">
      {notes.map(([n, libelle]) => (
        <button key={n} className={`note note-${n}`} onClick={() => repondre(n)}>
          <span>{libelle}</span>
          <span className="note-delai">{intervalles[n]}</span>
        </button>
      ))}
    </div>
  );
}

function CarteTerme({ carte, terme, repondre }: { carte: Carte; terme: Terme; repondre: (n: Note) => void }) {
  const [revelee, setRevelee] = useState(false);
  return (
    <div className="carte-question">
      <div className="carte-mot">
        <span className="carte-mot-categorie">{NOMS_CATEGORIES[terme.categorie]}</span>
        <span className="carte-mot-terme">{terme.terme}</span>
      </div>
      <p className="consigne">Que désigne ce terme ? Comment le reconnaître ?</p>
      {!revelee ? (
        <button className="bouton principal large grand" onClick={() => setRevelee(true)}>
          Voir la définition
        </button>
      ) : (
        <>
          <DefinitionTerme terme={terme} />
          <p className="discret centre">As-tu retrouvé l’essentiel ?</p>
          <BoutonsNotes carte={carte} repondre={repondre} />
        </>
      )}
    </div>
  );
}

function CarteDefinition({ terme, repondre }: { terme: Terme; repondre: (n: Note) => void }) {
  const options = useMemo(() => optionsTermes(terme.id), [terme.id]);
  const [choix, setChoix] = useState<string>();
  const juste = choix === terme.id;
  return (
    <div className="carte-question">
      <div className="carte-mot definition">
        <span className="carte-mot-categorie">{NOMS_CATEGORIES[terme.categorie]}</span>
        <span className="carte-mot-definition">{terme.definition}</span>
      </div>
      <p className="consigne">Quel terme correspond à cette définition ?</p>
      <div className="qcm">
        {options.map((id) => {
          const t = termeParId(id)!;
          const etat = !choix ? '' : id === terme.id ? 'juste' : id === choix ? 'faux' : 'neutre';
          return (
            <button key={id} className={`option ${etat}`} disabled={!!choix} onClick={() => setChoix(id)}>
              <span className="option-nom">{t.terme}</span>
            </button>
          );
        })}
      </div>
      {choix && (
        <>
          <p className={`verdict ${juste ? 'juste' : 'faux'}`}>{juste ? 'Bonne réponse !' : `C’était : ${terme.terme}`}</p>
          <button className="bouton principal large grand" onClick={() => repondre(juste ? 2 : 0)}>
            Continuer
          </button>
        </>
      )}
    </div>
  );
}

/** Définition et fiches d'exemple (les titres des fiches, sans lien pour ne pas quitter la séance). */
export function DefinitionTerme({ terme }: { terme: Terme }) {
  const exemples = useLive(async () => (terme.exemples?.length ? (await db.oeuvres.bulkGet(terme.exemples)).filter((o): o is Oeuvre => !!o) : []), [terme.id]);
  return (
    <div className="reponse">
      <p className="definition-texte">{terme.definition}</p>
      {exemples && exemples.length > 0 && (
        <p className="discret">
          À voir dans tes fiches : {exemples.map((o) => o.titre).join(' ; ')}
        </p>
      )}
    </div>
  );
}
