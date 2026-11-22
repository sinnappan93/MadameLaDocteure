import { useState } from 'react';
import { TYPES_EPREUVE } from '../../data/sujets';
import { compterMots, formatDuree, GRILLES, NOTE_CRITERE_MAX, type NoteCorrecteur } from '../../domain/examen';
import { reduireImage } from '../../lib/images';
import { ajouterPhotoCopie, db, modifierCopie, retirerPhotoCopie, supprimerCopie } from '../../lib/db';
import { commenterPlan, corrigerCopie, expliquerErreur, iaPrete } from '../../lib/ia';
import { useLive, useUrlFichier } from '../../lib/useLive';

/** Une copie rendue : texte ou photos, puis correction (ou commentaire du plan) par l'IA. */
export function CopieDetail({ id, retour }: { id: string; retour: () => void }) {
  const copie = useLive(() => db.copies.get(id), [id]);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });
  if (!copie) return <section className="panneau" />;
  const estPlan = copie.type === 'plan';
  const duree = copie.fin ? Math.round((new Date(copie.fin).getTime() - new Date(copie.debut).getTime()) / 60000) : undefined;

  const lancerIA = async () => {
    setEtat({ enCours: true });
    try {
      if (estPlan) await modifierCopie(id, { commentairePlan: await commenterPlan(copie) });
      else {
        const photos = (await db.fichiers.bulkGet(copie.photos)).flatMap((f) => (f ? [f.blob] : []));
        await modifierCopie(id, { correction: await corrigerCopie(copie, photos) });
      }
      setEtat({ enCours: false });
    } catch (e) {
      setEtat({ enCours: false, erreur: await expliquerErreur(e) });
    }
  };

  const pretPourIA = estPlan ? !!(copie.problematique?.trim() || copie.plan?.trim()) : copie.mode === 'manuscrit' ? copie.photos.length > 0 : copie.texte.trim().length > 0;

  return (
    <section className="panneau examen">
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">
          {estPlan ? 'Plan en 15 minutes' : TYPES_EPREUVE.find((t) => t.id === copie.type)?.nom} · prévu {formatDuree(copie.dureePrevueMin)}
          {duree !== undefined && ` · rendu en ${formatDuree(Math.max(1, duree))}`}
        </span>
        <span className="carte-sujet-intitule">{copie.sujet}</span>
      </div>

      {estPlan ? (
        <>
          <div className="bloc">
            <h3>Ta problématique</h3>
            <p className="texte-copie">{copie.problematique || '—'}</p>
          </div>
          <div className="bloc">
            <h3>Ton plan</h3>
            <p className="texte-copie">{copie.plan || '—'}</p>
          </div>
        </>
      ) : copie.mode === 'texte' ? (
        <details className="bloc" open={!copie.correction}>
          <summary>Ta copie · {compterMots(copie.texte)} mots</summary>
          <p className="texte-copie">{copie.texte || '—'}</p>
        </details>
      ) : (
        <div className="bloc">
          <h3>Photos de la copie ({copie.photos.length})</h3>
          <div className="pages-copie">
            {copie.photos.map((f, i) => (
              <PageCopie key={f} fichierId={f} numero={i + 1} retirer={() => confirm('Retirer cette page ?') && retirerPhotoCopie(id, f)} />
            ))}
          </div>
          <label className="bouton large depot-photo">
            + Photographier une page
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) await ajouterPhotoCopie(id, (await reduireImage(f, 2000)).blob);
              }}
            />
          </label>
          <p className="discret">Une photo par page, dans l’ordre, bien éclairée et à plat.</p>
        </div>
      )}

      {!(copie.correction || copie.commentairePlan) && (
        <div className="bloc appel-ia">
          <h3>{estPlan ? 'Commentaire de l’IA' : 'Correction par l’IA'}</h3>
          {estPlan ? (
            <p className="discret">Commentaire de la problématique et du plan, puis un plan de comparaison.</p>
          ) : (
            <ul className="discret grille">
              {GRILLES[copie.type as keyof typeof GRILLES].map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {!iaPrete() ? (
            <p className="discret">À activer dans Menu › Réglages › Intelligence artificielle (clé d’API et accord).</p>
          ) : (
            <button className="bouton principal large" disabled={etat.enCours || !pretPourIA} onClick={lancerIA}>
              {etat.enCours ? 'L’IA lit ta copie… (jusqu’à une minute)' : estPlan ? 'Faire commenter mon plan' : 'Faire corriger ma copie'}
            </button>
          )}
          {!pretPourIA && !estPlan && copie.mode === 'manuscrit' && <p className="discret">Ajoute d’abord les photos de ta copie.</p>}
          {etat.erreur && <p className="erreur">{etat.erreur}</p>}
          <p className="discret">La note de l’IA est indicative : elle complète la correction par un pair ou un enseignant, sans la remplacer.</p>
        </div>
      )}

      {copie.correction && (
        <div className="correction">
          <div className="note-globale">
            <span className="stat-valeur">{String(copie.correction.noteSur20).replace('.', ',')}</span>
            <span className="stat-libelle">/ 20 · note indicative</span>
          </div>
          <p>{copie.correction.appreciation}</p>
          {copie.correction.criteres.map((c) => (
            <div key={c.critere} className="critere-correction">
              <div className="critere-entete">
                <span className="critere-nom">{c.critere}</span>
                <span className="critere-note">
                  {String(c.note).replace('.', ',')} / {NOTE_CRITERE_MAX}
                </span>
              </div>
              <span className="barre">
                <span style={{ width: `${(c.note / NOTE_CRITERE_MAX) * 100}%` }} />
              </span>
              <p>{c.commentaire}</p>
            </div>
          ))}
          <Liste titre="Points forts" items={copie.correction.pointsForts} />
          <Liste titre="À améliorer" items={copie.correction.aAmeliorer} />
          <Liste titre="Conseils pour la prochaine copie" items={copie.correction.conseils} />
        </div>
      )}

      {!estPlan && <NoteDuCorrecteur id={id} note={copie.noteCorrecteur} />}

      {copie.commentairePlan && (
        <div className="correction">
          <p>{copie.commentairePlan.appreciation}</p>
          <div className="bloc">
            <h3>Sur la problématique</h3>
            <p>{copie.commentairePlan.problematique}</p>
          </div>
          <div className="bloc">
            <h3>Sur le plan</h3>
            <p>{copie.commentairePlan.plan}</p>
          </div>
          <Liste titre="Points forts" items={copie.commentairePlan.pointsForts} />
          <Liste titre="À améliorer" items={copie.commentairePlan.aAmeliorer} />
          <div className="bloc plan-propose">
            <h3>Un plan possible (parmi d’autres)</h3>
            <p className="carte-revision-titre">{copie.commentairePlan.planPropose.problematique}</p>
            {copie.commentairePlan.planPropose.parties.map((p) => (
              <div key={p.titre}>
                <p className="partie">{p.titre}</p>
                <ul>
                  {p.sousParties.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="actions">
        {(copie.correction || copie.commentairePlan) && iaPrete() && (
          <button className="bouton" disabled={etat.enCours} onClick={lancerIA}>
            {etat.enCours ? '…' : 'Refaire la correction'}
          </button>
        )}
        <button
          className="bouton danger"
          onClick={async () => {
            if (!confirm('Supprimer cette copie et sa correction ?')) return;
            await supprimerCopie(id);
            retour();
          }}
        >
          Supprimer
        </button>
      </div>
    </section>
  );
}

function Liste({ titre, items }: { titre: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="bloc">
      <h3>{titre}</h3>
      <ul className="points">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function PageCopie({ fichierId, numero, retirer }: { fichierId: string; numero: number; retirer: () => void }) {
  const fichier = useLive(() => db.fichiers.get(fichierId), [fichierId]);
  const url = useUrlFichier(fichier?.blob);
  return (
    <figure className="page-copie">
      {url && <img src={url} alt={`Page ${numero}`} />}
      <figcaption>
        Page {numero}{' '}
        <button className="lien danger" onClick={retirer}>
          Retirer
        </button>
      </figcaption>
    </figure>
  );
}

/** Note d'un enseignant ou d'un pair : elle prime sur celle de l'IA dans la projection. */
function NoteDuCorrecteur({ id, note }: { id: string; note?: NoteCorrecteur }) {
  const [edition, setEdition] = useState(false);
  const [valeur, setValeur] = useState(note ? String(note.note).replace('.', ',') : '');
  const [correcteur, setCorrecteur] = useState(note?.correcteur ?? '');
  const [commentaire, setCommentaire] = useState(note?.commentaire ?? '');
  const n = Number(valeur.replace(',', '.'));
  const valide = valeur.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 20;
  if (!edition)
    return (
      <div className="bloc note-correcteur">
        <h3>Note d’un correcteur</h3>
        {note ? (
          <p>
            <strong>{String(note.note).replace('.', ',')}/20</strong>
            {note.correcteur && ` · ${note.correcteur}`}
            {note.commentaire && <span className="discret"> · {note.commentaire}</span>}
          </p>
        ) : (
          <p className="discret">Enseignant, pair, prépa : sa note prime sur celle de l’IA dans la projection.</p>
        )}
        <button className="lien" onClick={() => setEdition(true)}>
          {note ? 'Modifier' : '+ Ajouter la note du correcteur'}
        </button>
      </div>
    );
  return (
    <form
      className="bloc formulaire note-correcteur"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valide) return;
        await modifierCopie(id, { noteCorrecteur: { note: Math.round(n * 2) / 2, correcteur: correcteur.trim(), commentaire: commentaire.trim() || undefined, le: new Date().toISOString() } });
        setEdition(false);
      }}
    >
      <h3>Note d’un correcteur</h3>
      <div className="deux-colonnes">
        <label>
          Note sur 20
          <input inputMode="decimal" value={valeur} onChange={(e) => setValeur(e.target.value)} placeholder="Ex. : 12,5" />
        </label>
        <label>
          Correcteur
          <input value={correcteur} onChange={(e) => setCorrecteur(e.target.value)} placeholder="Ex. : Mme X, binôme" />
        </label>
      </div>
      <label>
        Commentaire (facultatif)
        <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      </label>
      <div className="actions">
        {note && (
          <button
            type="button"
            className="bouton danger"
            onClick={async () => {
              await modifierCopie(id, { noteCorrecteur: undefined });
              setValeur('');
              setEdition(false);
            }}
          >
            Retirer
          </button>
        )}
        <button type="button" className="bouton" onClick={() => setEdition(false)}>
          Annuler
        </button>
        <button type="submit" className="bouton principal" disabled={!valide}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
