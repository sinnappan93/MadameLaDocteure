import { useState } from 'react';
import { aireParId, periodeParId } from '../domain/catalogue';
import { comparaisonsDe } from '../domain/comparaisons';
import { termesDeFiche } from '../domain/glossaire';
import { MUSEES } from '../domain/musees';
import { referenceCourte } from '../domain/preparation';
import { db, imagesDe, modifierOeuvre, retirerNotice, supprimerImage, supprimerOeuvre } from '../lib/db';
import { useLive } from '../lib/useLive';
import { AjoutImage } from './AjoutImage';
import { Bloc } from './Bloc';
import { NoticeDetaillee, RechercheMusees } from './RechercheMusees';
import { Vignette } from './Vignette';

export function FicheOeuvre({
  id,
  retour,
  modifier,
  ouvrirFiche,
  ouvrirLecture,
  ouvrirVisite,
}: {
  id: string;
  retour: () => void;
  modifier: () => void;
  ouvrirFiche?: (id: string) => void;
  ouvrirLecture?: (id: string) => void;
  ouvrirVisite?: (id: string) => void;
}) {
  const liens = useLive(async () => ({
    lectures: (await db.lectures.toArray()).filter((l) => l.oeuvreIds.includes(id)),
    visites: (await db.visites.toArray()).filter((v) => v.oeuvreIds.includes(id)),
  }), [id]);
  const oeuvre = useLive(() => db.oeuvres.get(id), [id]);
  const images = useLive(() => imagesDe(id), [id]);
  const aComparer = useLive(async () => {
    const liste = comparaisonsDe(id);
    const fiches = await db.oeuvres.bulkGet(liste.map((x) => x.autre));
    return liste.flatMap((x, i) => (fiches[i] ? [{ ...x, oeuvre: fiches[i]! }] : []));
  }, [id]);
  const [ajout, setAjout] = useState(false);
  const [musees, setMusees] = useState(false);
  const [selection, setSelection] = useState<string>();

  if (!oeuvre) return null;
  const affichee = images?.find((i) => i.id === selection) ?? images?.find((i) => i.id === oeuvre.imagePrincipaleId) ?? images?.[0];

  const supprimer = async () => {
    if (!confirm(`Supprimer la fiche « ${oeuvre.titre} » et ses images ?`)) return;
    await supprimerOeuvre(id);
    retour();
  };

  const lignes: Array<[string, string | undefined]> = [
    ['Période', periodeParId(oeuvre.periodeId)?.nom],
    ['Aire', aireParId(oeuvre.aireId)?.nom],
    ['Datation', oeuvre.datation],
    ['Site', oeuvre.site],
    ['Matériau', oeuvre.materiau],
    ['Conservation', oeuvre.conservation],
    ['Style', oeuvre.style],
  ];

  return (
    <article className="fiche panneau">
      <div className="galerie">
        <Vignette imageId={affichee?.id} alt={oeuvre.titre} className="grande" />
        {affichee && (
          <p className="credit-image">
            {affichee.source === 'photo' ? 'Photo personnelle' : [affichee.auteur, affichee.licence].filter(Boolean).join(' · ') || 'Crédits inconnus'}
            {affichee.urlOrigine && (
              <>
                {' · '}
                <a href={affichee.urlOrigine} target="_blank" rel="noreferrer">
                  source
                </a>
              </>
            )}
          </p>
        )}
        <div className="miniatures">
          {images?.map((i) => (
            <button key={i.id} className={i.id === affichee?.id ? 'active' : ''} onClick={() => setSelection(i.id)}>
              <Vignette imageId={i.id} alt="" />
            </button>
          ))}
          <button className="ajout-image" onClick={() => setAjout(true)} aria-label="Ajouter une image">
            +
          </button>
        </div>
        {affichee && (
          <div className="actions-image">
            {affichee.id !== oeuvre.imagePrincipaleId && (
              <button className="lien" onClick={() => modifierOeuvre(id, { imagePrincipaleId: affichee.id })}>
                Mettre en couverture
              </button>
            )}
            <button
              className="lien danger"
              onClick={async () => {
                if (confirm('Retirer cette image ?')) {
                  await supprimerImage(affichee.id);
                  setSelection(undefined);
                }
              }}
            >
              Retirer l’image
            </button>
          </div>
        )}
      </div>

      <h2>{oeuvre.titre}</h2>
      {oeuvre.reference && <p className="badge-reference">Fiche préparée · à vérifier avec tes sources</p>}
      {!affichee && (
        <button className="bouton principal trouver-image" onClick={() => setAjout(true)}>
          Trouver une image
        </button>
      )}
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
      {oeuvre.iconographie && <Bloc titre="Iconographie" texte={oeuvre.iconographie} />}
      {oeuvre.notes && <Bloc titre="Points à retenir" texte={oeuvre.notes} />}
      {oeuvre.bibliographie && <Bloc titre="Bibliographie" texte={oeuvre.bibliographie} />}
      {aComparer && aComparer.length > 0 && (
        <section className="bloc">
          <h3>À comparer avec</h3>
          {aComparer.map(({ comparaison, oeuvre: autre }) => (
            <button key={comparaison.id} className="lien-comparaison" onClick={() => ouvrirFiche?.(autre.id)}>
              <span className="carte-revision-titre">{autre.titre}</span>
              <span className="discret">{comparaison.titre} · critères dans Menu › Ressources › Comparaisons</span>
            </button>
          ))}
        </section>
      )}
      {termesDeFiche(id).length > 0 && (
        <details className="bloc vocabulaire">
          <summary>Vocabulaire à connaître ({termesDeFiche(id).length})</summary>
          <dl>
            {termesDeFiche(id).map((t) => (
              <div key={t.id}>
                <dt>{t.terme}</dt>
                <dd>{t.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {liens && liens.lectures.length + liens.visites.length > 0 && (
        <div className="bloc liens-preparation">
          {liens.lectures.length > 0 && (
            <p>
              <strong>Citée dans :</strong>{' '}
              {liens.lectures.map((l, i) => (
                <span key={l.id}>
                  {i > 0 && ', '}
                  <button className="lien" onClick={() => ouvrirLecture?.(l.id)}>
                    {referenceCourte(l)}
                  </button>
                </span>
              ))}
            </p>
          )}
          {liens.visites.map((v) => (
            <p key={v.id}>
              <strong>Photographiée</strong> lors de la{' '}
              <button className="lien" onClick={() => ouvrirVisite?.(v.id)}>
                visite du {new Date(`${v.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </button>
            </p>
          ))}
        </div>
      )}

      <section className="section-musees">
        <div className="titre-section">
          <h2>Dans les musées</h2>
          <button className="lien" onClick={() => setMusees(true)}>
            Chercher
          </button>
        </div>
        {(oeuvre.notices ?? []).length === 0 && (
          <button className="carte-revision invitation" onClick={() => setMusees(true)}>
            <span>
              <span className="carte-revision-titre">Ajouter des œuvres réelles comparables</span>
              <span className="discret">Notices officielles de Cleveland, du Met et de Chicago : inventaire, dimensions, provenance, bibliographie.</span>
            </span>
            <span className="plus-rond" aria-hidden>
              +
            </span>
          </button>
        )}
        {(oeuvre.notices ?? []).map((n) => (
          <details key={`${n.source}-${n.idMusee}`} className="notice-jointe">
            <summary>
              <span className="carte-revision-titre">{n.titre}</span>
              <span className="discret">
                {MUSEES[n.source].court} · inv. {n.inventaire}
              </span>
            </summary>
            <NoticeDetaillee notice={n} compacte />
            <button
              className="lien danger"
              onClick={() => {
                if (confirm('Retirer cette notice de la fiche ?')) void retirerNotice(id, n);
              }}
            >
              Retirer la notice
            </button>
          </details>
        ))}
      </section>
      {oeuvre.etiquettes.length > 0 && (
        <p className="etiquettes">
          {oeuvre.etiquettes.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
      )}

      <div className="actions">
        <button className="bouton danger" onClick={supprimer}>
          Supprimer
        </button>
        <button className="bouton principal" onClick={modifier}>
          Modifier
        </button>
      </div>

      {ajout && <AjoutImage oeuvre={oeuvre} fermer={() => setAjout(false)} />}
      {musees && <RechercheMusees oeuvre={oeuvre} fermer={() => setMusees(false)} />}
    </article>
  );
}
