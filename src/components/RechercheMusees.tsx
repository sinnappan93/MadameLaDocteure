import { useEffect, useRef, useState } from 'react';
import { chercherDansLesMusees, datationNotice, MUSEES, type NoticeMusee, type SourceMusee } from '../domain/musees';
import { oeuvreVide, type Oeuvre } from '../domain/types';
import { ajouterImage, ajouterNotice, creerOeuvre } from '../lib/db';
import { telechargerImage } from '../lib/images';

interface Props {
  /** Fiche à laquelle joindre la notice ; sans fiche, la notice sert à en créer une. */
  oeuvre?: Oeuvre;
  fermer: () => void;
  /** Appelé après la création d'une fiche à partir d'une notice. */
  ouvrirFiche?: (id: string) => void;
}

const SOURCES: SourceMusee[] = ['cleveland', 'met', 'aic'];

/** Image de la notice : enregistrée sur l'appareil si le musée le permet, sinon affichée en ligne. */
async function joindreImage(oeuvreId: string, n: NoticeMusee) {
  if (!n.image) return;
  const meta = {
    source: 'musee' as const,
    titre: `${n.titre} (inv. ${n.inventaire})`,
    auteur: MUSEES[n.source].nom,
    licence: n.source === 'aic' ? 'CC0 (image)' : 'CC0',
    urlOrigine: n.lien,
  };
  try {
    const { blob, largeur, hauteur } = await telechargerImage(n.image);
    await ajouterImage(oeuvreId, blob, { ...meta, largeur, hauteur });
  } catch {
    await ajouterImage(oeuvreId, undefined, { ...meta, urlDistante: n.image });
  }
}

export function RechercheMusees({ oeuvre, fermer, ouvrirFiche }: Props) {
  const [requete, setRequete] = useState(oeuvre?.requeteImage ?? '');
  const [sources, setSources] = useState<SourceMusee[]>(SOURCES);
  const [resultats, setResultats] = useState<NoticeMusee[]>([]);
  const [erreurs, setErreurs] = useState<SourceMusee[]>([]);
  const [etat, setEtat] = useState<'repos' | 'chargement' | 'fini'>('repos');
  const [detail, setDetail] = useState<NoticeMusee>();
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string>();
  const controleur = useRef<AbortController>();

  const chercher = async () => {
    if (!requete.trim()) return;
    controleur.current?.abort();
    controleur.current = new AbortController();
    setEtat('chargement');
    setDetail(undefined);
    try {
      const r = await chercherDansLesMusees(requete.trim(), sources, controleur.current.signal);
      setResultats(r.notices);
      setErreurs(r.erreurs);
      setEtat('fini');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setEtat('fini');
    }
  };

  useEffect(() => {
    if (requete) void chercher();
    return () => controleur.current?.abort();
  }, []);

  const joindre = async (n: NoticeMusee, avecImage: boolean) => {
    if (!oeuvre) return;
    setOccupe(true);
    try {
      await ajouterNotice(oeuvre.id, n);
      if (avecImage) await joindreImage(oeuvre.id, n);
      fermer();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  const creerFiche = async (n: NoticeMusee) => {
    setOccupe(true);
    try {
      const o = await creerOeuvre({
        ...oeuvreVide(),
        titre: n.titre,
        datation: datationNotice(n),
        debut: n.debut,
        fin: n.fin,
        site: n.culture ?? '',
        materiau: [n.materiau, n.dimensions].filter(Boolean).join(' ; '),
        conservation: `${MUSEES[n.source].nom} (inv. ${n.inventaire})`,
        etiquettes: ['musée'],
        requeteImage: n.titre,
      });
      await ajouterNotice(o.id, n);
      await joindreImage(o.id, n);
      fermer();
      ouvrirFiche?.(o.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="feuille-fond" onClick={fermer}>
      <div className="feuille" role="dialog" aria-label="Œuvres dans les musées" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-entete">
          <h2>{detail ? 'Notice du musée' : 'Œuvres dans les musées'}</h2>
          <button className="bouton-icone" onClick={detail ? () => setDetail(undefined) : fermer} aria-label={detail ? 'Retour aux résultats' : 'Fermer'}>
            {detail ? '←' : '✕'}
          </button>
        </div>

        {message && <p className="erreur">{message}</p>}

        {detail ? (
          <div>
            <NoticeDetaillee notice={detail} />
            <div className="actions">
              {oeuvre ? (
                <>
                  <button className="bouton" disabled={occupe} onClick={() => joindre(detail, false)}>
                    Joindre sans l’image
                  </button>
                  <button className="bouton principal" disabled={occupe} onClick={() => joindre(detail, true)}>
                    Joindre à la fiche
                  </button>
                </>
              ) : (
                <button className="bouton principal" disabled={occupe} onClick={() => creerFiche(detail)}>
                  Créer une fiche
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <form
              className="barre-recherche"
              onSubmit={(e) => {
                e.preventDefault();
                void chercher();
              }}
            >
              <input type="search" value={requete} onChange={(e) => setRequete(e.target.value)} placeholder="Nataraja, Gandhara Buddha, Khmer Vishnu…" autoFocus={!oeuvre} />
              <button className="bouton principal" type="submit">
                Chercher
              </button>
            </form>
            <div className="puces" role="group" aria-label="Musées">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={sources.includes(s) ? 'actif' : ''}
                  aria-pressed={sources.includes(s)}
                  onClick={() => setSources((l) => (l.includes(s) ? (l.length > 1 ? l.filter((x) => x !== s) : l) : [...l, s]))}
                >
                  {MUSEES[s].court}
                </button>
              ))}
            </div>
            <p className="discret">Œuvres réelles des collections de Cleveland, du Met (New York) et de Chicago, images libres de droits. Notices en anglais ; chercher en anglais.</p>
            {erreurs.length > 0 && <p className="erreur">Sans réponse : {erreurs.map((e) => MUSEES[e].court).join(', ')}.</p>}
            {etat === 'chargement' && <p className="discret">Recherche dans les musées…</p>}
            {etat === 'fini' && resultats.length === 0 && <p className="discret">Aucune œuvre trouvée. Essayez d’autres mots (en anglais).</p>}
            <ul className="liste-notices">
              {resultats.map((n) => (
                <li key={`${n.source}-${n.idMusee}`}>
                  <button className="notice-resultat" onClick={() => setDetail(n)}>
                    {n.vignette ? <img src={n.vignette} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="vignette vide" />}
                    <span>
                      <span className="carte-revision-titre">{n.titre}</span>
                      <span className="discret">{[datationNotice(n), n.materiau].filter(Boolean).join(' · ')}</span>
                      <span className="musee">
                        {MUSEES[n.source].court} · inv. {n.inventaire}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** Notice complète d'une œuvre de musée, telle que publiée par le musée. */
export function NoticeDetaillee({ notice: n, compacte }: { notice: NoticeMusee; compacte?: boolean }) {
  const lignes: Array<[string, string | undefined]> = [
    ['Musée', MUSEES[n.source].nom],
    ['Inventaire', n.inventaire],
    ['Datation', datationNotice(n)],
    ['Culture', n.culture],
    ['Matériau', n.materiau],
    ['Dimensions', n.dimensions],
    ['Acquisition', n.creditLine],
  ];
  return (
    <div className="notice">
      {!compacte && n.image && <img className="notice-image" src={n.image} alt={n.titre} referrerPolicy="no-referrer" />}
      <h3 className="notice-titre">{n.titre}</h3>
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
      {n.description && (
        <section className="bloc">
          <h3>Notice du musée</h3>
          <p lang="en">{n.description}</p>
        </section>
      )}
      {n.provenance && n.provenance.length > 0 && (
        <details className="bloc">
          <summary>Provenance ({n.provenance.length})</summary>
          <ol lang="en">
            {n.provenance.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </details>
      )}
      {n.bibliographie && n.bibliographie.length > 0 && (
        <details className="bloc">
          <summary>Bibliographie du musée ({n.bibliographie.length})</summary>
          <ul lang="en">
            {n.bibliographie.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="discret">
        Source :{' '}
        <a href={n.lien} target="_blank" rel="noreferrer">
          notice en ligne du musée
        </a>{' '}
        · {MUSEES[n.source].licenceTexte}
      </p>
    </div>
  );
}
