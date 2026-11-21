import { useState } from 'react';
import { aireParId, periodeParId } from '../domain/catalogue';
import { db, imagesDe, modifierOeuvre, supprimerImage, supprimerOeuvre } from '../lib/db';
import { useLive } from '../lib/useLive';
import { AjoutImage } from './AjoutImage';
import { Vignette } from './Vignette';

export function FicheOeuvre({ id, retour, modifier }: { id: string; retour: () => void; modifier: () => void }) {
  const oeuvre = useLive(() => db.oeuvres.get(id), [id]);
  const images = useLive(() => imagesDe(id), [id]);
  const [ajout, setAjout] = useState(false);
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
    </article>
  );
}

function Bloc({ titre, texte }: { titre: string; texte: string }) {
  return (
    <section className="bloc">
      <h3>{titre}</h3>
      <p>{texte}</p>
    </section>
  );
}
