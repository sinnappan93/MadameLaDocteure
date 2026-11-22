import { useState } from 'react';
import { TYPES_LECTURE } from '../../data/preparation';
import { aireParId } from '../../domain/catalogue';
import { avancement, lirePages, NOMS_STATUTS, type StatutLecture } from '../../domain/preparation';
import { db, modifierLecture, supprimerLecture } from '../../lib/db';
import { useLive } from '../../lib/useLive';
import { TexteAuto } from '../oral/communs';
import { Vignette } from '../Vignette';
import { FormulaireLecture } from './Bibliographie';

const normaliser = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Une lecture : avancement (pages lues), notes, œuvres citées. */
export function LectureDetail({ id, retour, ouvrirFiche }: { id: string; retour: () => void; ouvrirFiche: (id: string) => void }) {
  const l = useLive(() => db.lectures.get(id), [id]);
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const [edition, setEdition] = useState(false);
  const [page, setPage] = useState('');
  const [recherche, setRecherche] = useState('');
  if (!l || !oeuvres) return <section className="panneau" />;
  if (edition)
    return (
      <section className="panneau biblio">
        <FormulaireLecture
          initiale={l}
          annuler={() => setEdition(false)}
          enregistrer={async (n) => {
            await modifierLecture(id, n);
            setEdition(false);
          }}
        />
      </section>
    );

  const a = avancement(l);
  const citees = l.oeuvreIds.map((o) => oeuvres.find((x) => x.id === o)).filter((o) => !!o);
  const trouvees = recherche.trim().length >= 2 ? oeuvres.filter((o) => !l.oeuvreIds.includes(o.id) && normaliser(o.titre).includes(normaliser(recherche.trim()))).slice(0, 6) : [];
  const noter = async () => {
    const n = Number(page);
    if (!Number.isFinite(n) || n <= 0) return;
    await modifierLecture(id, lirePages(l, n));
    setPage('');
  };

  return (
    <section className="panneau biblio">
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">
          {TYPES_LECTURE[l.type]}
          {l.aires.length > 0 && ` · ${l.aires.map((x) => aireParId(x)?.nom).join(', ')}`}
        </span>
        <span className="carte-sujet-intitule">{l.titre}</span>
        <span>{[l.auteurs, l.editeur, l.annee].filter(Boolean).join(' · ')}</span>
        {l.lien && (
          <a href={l.lien} target="_blank" rel="noreferrer" className="lien-clair">
            Ouvrir le lien ↗
          </a>
        )}
      </div>

      <div className="puces" role="radiogroup" aria-label="Statut">
        {(Object.keys(NOMS_STATUTS) as StatutLecture[]).map((s) => (
          <button key={s} role="radio" aria-checked={l.statut === s} className={l.statut === s ? 'actif' : ''} onClick={() => modifierLecture(id, { statut: s })}>
            {NOMS_STATUTS[s]}
          </button>
        ))}
      </div>

      <div className="bloc">
        <h3>Avancement</h3>
        {a !== undefined ? (
          <>
            <span className="progression-libelle">
              Page {l.pageActuelle} sur {l.pagesTotal} · {Math.round(a * 100)} %
            </span>
            <span className="barre">
              <span style={{ width: `${a * 100}%` }} />
            </span>
          </>
        ) : (
          <p className="discret">{l.pageActuelle ? `Dernière page lue : ${l.pageActuelle}.` : 'Indique le nombre de pages (Modifier) pour suivre l’avancement.'}</p>
        )}
        <div className="saisie-pages">
          <label>
            J’ai lu jusqu’à la page
            <input type="number" inputMode="numeric" min={1} value={page} onChange={(e) => setPage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && noter()} />
          </label>
          <button className="bouton principal" disabled={!page} onClick={noter}>
            Noter
          </button>
        </div>
        {l.historique.length > 0 && (
          <ul className="historique-lecture">
            {[...l.historique].reverse().slice(0, 8).map((h) => (
              <li key={h.date}>
                {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : {h.pages} page{h.pages > 1 ? 's' : ''} (jusqu’à p. {h.jusqua})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bloc">
        <h3>Notes de lecture</h3>
        <TexteAuto
          rows={8}
          initial={l.notes}
          placeholder="Idées clés, citations avec la page, débats, ce que tu pourras réutiliser en dissertation…"
          enregistrer={(notes) => modifierLecture(id, { notes })}
          aria-label="Notes de lecture"
        />
      </div>

      <div className="bloc">
        <h3>Œuvres citées ({citees.length})</h3>
        {citees.map((o) => (
          <div key={o!.id} className="oeuvre-liee">
            <button className="oeuvre-liee-bouton" onClick={() => ouvrirFiche(o!.id)}>
              <Vignette imageId={o!.imagePrincipaleId} alt="" />
              <span>{o!.titre}</span>
            </button>
            <button className="lien danger" aria-label={`Retirer ${o!.titre}`} onClick={() => modifierLecture(id, { oeuvreIds: l.oeuvreIds.filter((x) => x !== o!.id) })}>
              ✕
            </button>
          </div>
        ))}
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Relier une fiche : tape son titre…" aria-label="Chercher une fiche à relier" />
        {trouvees.map((o) => (
          <button
            key={o.id}
            className="resultat-fiche"
            onClick={() => {
              modifierLecture(id, { oeuvreIds: [...l.oeuvreIds, o.id] });
              setRecherche('');
            }}
          >
            + {o.titre}
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="bouton" onClick={() => setEdition(true)}>
          Modifier
        </button>
        <button
          className="bouton danger"
          onClick={async () => {
            if (!confirm('Supprimer cette lecture et ses notes ?')) return;
            await supprimerLecture(id);
            retour();
          }}
        >
          Supprimer
        </button>
      </div>
    </section>
  );
}
