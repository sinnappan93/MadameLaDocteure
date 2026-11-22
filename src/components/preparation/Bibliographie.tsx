import { useState } from 'react';
import { SUGGESTIONS_LECTURE, type TypeLecture, TYPES_LECTURE } from '../../data/preparation';
import { AIRES } from '../../domain/catalogue';
import { avancement, type Lecture, lectureDeSuggestion, type NouvelleLecture, NOMS_STATUTS, type StatutLecture } from '../../domain/preparation';
import { creerLecture, db } from '../../lib/db';
import { useLive } from '../../lib/useLive';

const FILTRES: Array<[StatutLecture | '', string]> = [
  ['', 'Tout'],
  ['en-cours', 'En cours'],
  ['a-lire', 'À lire'],
  ['lu', 'Lu'],
];

/** Liste des lectures, filtres par statut, ajout et suggestions. */
export function Bibliographie({ ouvrir }: { ouvrir: (id: string) => void }) {
  const lectures = useLive(async () => (await db.lectures.toArray()).sort((a, b) => b.modifieeLe.localeCompare(a.modifieeLe)), []);
  const [filtre, setFiltre] = useState<StatutLecture | ''>('');
  const [ajout, setAjout] = useState(false);
  if (!lectures) return <section className="panneau" />;
  const visibles = lectures.filter((l) => !filtre || l.statut === filtre);
  const deja = new Set(lectures.map((l) => l.suggestionId));
  const suggestions = SUGGESTIONS_LECTURE.filter((s) => !deja.has(s.id));
  const pagesTotal = lectures.reduce((t, l) => t + l.historique.reduce((u, h) => u + h.pages, 0), 0);

  return (
    <section className="panneau biblio">
      {lectures.length > 0 && (
        <div className="stats-revision">
          <div className="stat">
            <span className="stat-valeur">{lectures.filter((l) => l.statut === 'lu').length}</span>
            <span className="stat-libelle">lu{lectures.filter((l) => l.statut === 'lu').length > 1 ? 's' : ''} sur {lectures.length}</span>
          </div>
          <div className="stat">
            <span className="stat-valeur">{pagesTotal}</span>
            <span className="stat-libelle">pages notées</span>
          </div>
        </div>
      )}
      <div className="puces" role="radiogroup" aria-label="Statut">
        {FILTRES.map(([id, nom]) => (
          <button key={id} role="radio" aria-checked={filtre === id} className={filtre === id ? 'actif' : ''} onClick={() => setFiltre(id)}>
            {nom}
          </button>
        ))}
      </div>

      {ajout ? (
        <FormulaireLecture
          annuler={() => setAjout(false)}
          enregistrer={async (n) => {
            const l = await creerLecture(n);
            setAjout(false);
            ouvrir(l.id);
          }}
        />
      ) : (
        <button className="bouton large" onClick={() => setAjout(true)}>
          + Ajouter un livre ou un article
        </button>
      )}

      {lectures.length === 0 && <p className="vide-etat">Ta bibliographie est vide : ajoute tes lectures, ou pars des suggestions ci-dessous.</p>}
      <ul className="liste-lectures">
        {visibles.map((l) => (
          <li key={l.id}>
            <LigneLecture l={l} ouvrir={() => ouvrir(l.id)} />
          </li>
        ))}
      </ul>

      {suggestions.length > 0 && (
        <details className="bloc suggestions" open={lectures.length === 0}>
          <summary>Suggestions de lecture ({suggestions.length})</summary>
          {suggestions.map((s) => (
            <div key={s.id} className="suggestion">
              <div>
                <strong>{s.titre}</strong>
                <span className="discret">
                  {[s.auteurs, s.annee, s.editeur].filter(Boolean).join(' · ')}
                </span>
                <span className="discret">{s.pourquoi}</span>
              </div>
              <button className="bouton petit" onClick={() => creerLecture(lectureDeSuggestion(s))}>
                + Ajouter
              </button>
            </div>
          ))}
          <p className="discret">Points de départ à vérifier (édition, année, pages) : complète chaque référence une fois ajoutée.</p>
        </details>
      )}
    </section>
  );
}

export function LigneLecture({ l, ouvrir }: { l: Lecture; ouvrir: () => void }) {
  const a = avancement(l);
  return (
    <button className="carte-revision lecture-ligne" onClick={ouvrir}>
      <span className="carte-revision-texte">
        <span className="carte-mot-categorie">
          {TYPES_LECTURE[l.type]} · {NOMS_STATUTS[l.statut]}
          {l.oeuvreIds.length > 0 && ` · ${l.oeuvreIds.length} œuvre${l.oeuvreIds.length > 1 ? 's' : ''}`}
        </span>
        <span className="carte-revision-titre">{l.titre}</span>
        <span className="discret">{[l.auteurs, l.annee].filter(Boolean).join(', ')}</span>
        {a !== undefined && (
          <>
            <span className="progression-libelle">
              {l.statut === 'lu' ? 'Terminé' : `p. ${l.pageActuelle} / ${l.pagesTotal}`} · {Math.round(a * 100)} %
            </span>
            <span className="barre">
              <span style={{ width: `${a * 100}%` }} />
            </span>
          </>
        )}
      </span>
    </button>
  );
}

export function FormulaireLecture({ initiale, annuler, enregistrer }: { initiale?: Lecture; annuler: () => void; enregistrer: (n: NouvelleLecture) => Promise<void> }) {
  const [n, setN] = useState<NouvelleLecture>(
    initiale ?? { type: 'livre', titre: '', auteurs: '', editeur: '', lien: '', aires: [] },
  );
  const maj = (c: Partial<NouvelleLecture>) => setN((x) => ({ ...x, ...c }));
  return (
    <form
      className="formulaire bloc"
      onSubmit={async (e) => {
        e.preventDefault();
        if (n.titre.trim()) await enregistrer({ ...n, titre: n.titre.trim(), auteurs: n.auteurs.trim() });
      }}
    >
      <label>
        Titre
        <input required value={n.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Ex. : The Art of Ancient India" />
      </label>
      <label>
        Auteurs
        <input value={n.auteurs} onChange={(e) => maj({ auteurs: e.target.value })} placeholder="Ex. : Susan L. Huntington" />
      </label>
      <div className="deux-colonnes">
        <label>
          Type
          <select value={n.type} onChange={(e) => maj({ type: e.target.value as TypeLecture })}>
            {Object.entries(TYPES_LECTURE).map(([id, nom]) => (
              <option key={id} value={id}>
                {nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Année
          <input type="number" inputMode="numeric" value={n.annee ?? ''} onChange={(e) => maj({ annee: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
      </div>
      <div className="deux-colonnes">
        <label>
          Éditeur ou revue
          <input value={n.editeur} onChange={(e) => maj({ editeur: e.target.value })} />
        </label>
        <label>
          Nombre de pages
          <input type="number" inputMode="numeric" min={1} value={n.pagesTotal ?? ''} onChange={(e) => maj({ pagesTotal: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
      </div>
      <label>
        Lien (bibliothèque, Persée, JSTOR…)
        <input type="url" value={n.lien} onChange={(e) => maj({ lien: e.target.value })} placeholder="https://…" />
      </label>
      <div>
        <span className="libelle">Aires traitées</span>
        <div className="puces">
          {AIRES.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={n.aires.includes(a.id)}
              className={n.aires.includes(a.id) ? 'actif' : ''}
              onClick={() => maj({ aires: n.aires.includes(a.id) ? n.aires.filter((x) => x !== a.id) : [...n.aires, a.id] })}
            >
              {a.nom}
            </button>
          ))}
        </div>
      </div>
      <div className="actions">
        <button type="button" className="bouton" onClick={annuler}>
          Annuler
        </button>
        <button type="submit" className="bouton principal">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
