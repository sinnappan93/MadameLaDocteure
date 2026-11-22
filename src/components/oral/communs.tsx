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
  const enSaisie = useRef(false);
  // Texte changé ailleurs (transcription) : on l'affiche, sauf pendant la saisie.
  useEffect(() => {
    if (!enSaisie.current && initial !== dernier.current) {
      dernier.current = initial;
      setTexte(initial);
    }
  }, [initial]);
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
      onFocus={() => {
        enSaisie.current = true;
      }}
      onBlur={() => {
        enSaisie.current = false;
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

const CLE_MODELE = 'madameladocteure:modele-transcription';
const modeleDejaTelecharge = () => {
  try {
    return localStorage.getItem(CLE_MODELE) === 'oui';
  } catch {
    return false;
  }
};

/** Bouton « Transcrire l'enregistrement » : Whisper sur l'appareil, avec l'avancement. */
export function BoutonTranscrire({
  fichierId,
  texte,
  enregistrer,
  vocabulaire,
  libelle = 'Transcrire l’enregistrement',
}: {
  fichierId: string;
  texte: string;
  enregistrer: (t: string) => Promise<void> | void;
  /** Noms du dossier et des notes, pour aider à reconnaître les noms propres. */
  vocabulaire?: string;
  libelle?: string;
}) {
  const [etat, setEtat] = useState<{ enCours: boolean; message?: string; erreur?: string; apercu?: string }>({ enCours: false });
  const lancer = async () => {
    if (texte.trim() && !confirm('Remplacer le texte actuel par la transcription ?')) return;
    setEtat({ enCours: true, message: 'Préparation de l’audio…' });
    try {
      const fichier = await db.fichiers.get(fichierId);
      if (!fichier) throw new Error('Enregistrement introuvable.');
      const { transcrire } = await import('../../lib/transcription');
      const resultat = await transcrire(
        fichier.blob,
        (a) =>
          setEtat({
            enCours: true,
            message: a.etape === 'telechargement' ? `Téléchargement du modèle (une seule fois) : ${Math.round(a.part * 100)} %` : `Transcription : ${Math.round(a.part * 100)} %`,
            apercu: a.texte,
          }),
        vocabulaire,
      );
      try {
        localStorage.setItem(CLE_MODELE, 'oui');
      } catch {
        /* stockage indisponible */
      }
      if (!resultat.trim()) throw new Error('Aucune parole reconnue dans l’enregistrement.');
      await enregistrer(resultat);
      setEtat({ enCours: false });
    } catch (e) {
      setEtat({ enCours: false, erreur: `Transcription impossible : ${e instanceof Error ? e.message : String(e)}${navigator.onLine ? '' : ' (le modèle doit être téléchargé une première fois avec du réseau)'}` });
    }
  };
  return (
    <div className="transcription">
      <button className="bouton petit" disabled={etat.enCours} onClick={lancer}>
        {etat.enCours ? 'Transcription en cours…' : `✎ ${libelle}`}
      </button>
      {etat.enCours && (
        <>
          <p className="discret">{etat.message}</p>
          {etat.apercu && <p className="transcription-direct">{etat.apercu}</p>}
        </>
      )}
      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
    </div>
  );
}

/** Explication affichée près des boutons de transcription. */
export function NoteTranscription() {
  return (
    <p className="discret">
      La transcription se fait sur ton appareil (modèle Whisper) : rien n’est envoyé.{' '}
      {modeleDejaTelecharge()
        ? 'Le modèle est déjà téléchargé : elle marche hors ligne.'
        : 'La première fois, le modèle est téléchargé (environ 80 Mo, Wi-Fi conseillé), puis elle marche hors ligne.'}{' '}
      Compte environ le temps de l’enregistrement, parfois plus sur un téléphone ancien.
    </p>
  );
}
