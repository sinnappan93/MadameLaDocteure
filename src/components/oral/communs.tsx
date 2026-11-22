import { useEffect, useRef, useState } from 'react';
import type { DossierOral } from '../../domain/oral';
import { db } from '../../lib/db';
import { useLive, useUrlFichier } from '../../lib/useLive';
import { Vignette } from '../Vignette';

/** Documents du dossier : images, avec ou sans cartel. */
export function DossierVue({ dossier, cartels, ouvrirFiche }: { dossier: DossierOral; cartels?: boolean; ouvrirFiche?: (id: string) => void }) {
  const [agrandie, setAgrandie] = useState<number>();
  const montrer = cartels ?? !dossier.sansCartels;
  if (!dossier.documents.length) return null;
  return (
    <div className="dossier-oral">
      {dossier.documents.map((d, i) => (
        <figure key={d.oeuvreId + i} className={`doc-oral ${agrandie === i ? 'agrandie' : ''}`}>
          <button className="doc-image" onClick={() => setAgrandie(agrandie === i ? undefined : i)} aria-label={agrandie === i ? 'Réduire' : 'Agrandir'}>
            {d.imageId ? <Vignette imageId={d.imageId} alt={montrer ? d.titre : `Document ${i + 1}`} /> : <span className="doc-sans-image">Pas d’image{montrer ? '' : ` : ${d.titre}`}</span>}
          </button>
          <figcaption>
            <strong>Document {i + 1}</strong>
            {montrer && (
              <>
                <span>{d.titre}</span>
                <span className="discret">{[d.datation, d.materiau, d.site, d.conservation].filter(Boolean).join(' · ')}</span>
              </>
            )}
            {ouvrirFiche && (
              <button className="lien" onClick={() => ouvrirFiche(d.oeuvreId)}>
                Voir la fiche
              </button>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Lecteur d'un enregistrement stocké sur l'appareil. */
export function LecteurAudio({ fichierId }: { fichierId: string }) {
  const fichier = useLive(() => db.fichiers.get(fichierId), [fichierId]);
  const url = useUrlFichier(fichier?.blob);
  if (fichier === undefined) return null;
  if (!url) return <p className="discret">Enregistrement introuvable.</p>;
  return (
    <audio
      className="lecteur-audio"
      controls
      preload="metadata"
      src={url}
      onLoadedMetadata={(e) => {
        // Les enregistrements WebM de Chrome n'indiquent pas leur durée : on la fait calculer en allant à la fin, puis on revient au début.
        const a = e.currentTarget;
        if (a.duration !== Infinity) return;
        const revenir = () => {
          a.removeEventListener('durationchange', revenir);
          a.currentTime = 0;
        };
        a.addEventListener('durationchange', revenir);
        a.currentTime = 1e7;
      }}
    />
  );
}

/** Zone de texte enregistrée automatiquement (800 ms après la dernière frappe). */
export function TexteAuto({
  initial,
  enregistrer,
  ...props
}: { initial: string; enregistrer: (texte: string) => Promise<void> | void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  const [texte, setTexte] = useState(initial);
  const minuteur = useRef<ReturnType<typeof setTimeout>>();
  const dernier = useRef(initial);
  useEffect(
    () => () => {
      clearTimeout(minuteur.current);
    },
    [],
  );
  return (
    <textarea
      {...props}
      value={texte}
      onChange={(e) => {
        const v = e.target.value;
        setTexte(v);
        dernier.current = v;
        clearTimeout(minuteur.current);
        minuteur.current = setTimeout(() => enregistrer(dernier.current), 800);
      }}
      onBlur={() => {
        clearTimeout(minuteur.current);
        enregistrer(dernier.current);
      }}
    />
  );
}

/** Durée écoulée depuis un instant, mise à jour chaque seconde. */
export function useEcoule(depuis: number | undefined): number {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!depuis) {
      setS(0);
      return;
    }
    setS((Date.now() - depuis) / 1000);
    const t = setInterval(() => setS((Date.now() - depuis) / 1000), 1000);
    return () => clearInterval(t);
  }, [depuis]);
  return s;
}
