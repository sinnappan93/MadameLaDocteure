import { useEffect, useRef, useState } from 'react';
import { formatChrono } from '../../domain/examen';
import { minutage, NOMS_CATEGORIES, type Oral, questionsDeBanque, type QuestionJury, vocabulaireOral } from '../../domain/oral';
import {
  arreterLecture,
  demarrerDictee,
  demarrerEnregistrement,
  type Dictee,
  type Enregistrement,
  enregistrementPossible,
  garderEcranAllume,
  lecturePossible,
  lireAVoixHaute,
} from '../../lib/audio';
import { db, enregistrerAudio, modifierOral } from '../../lib/db';
import { expliquerErreur, iaPrete, questionsJury } from '../../lib/ia';
import { useLive } from '../../lib/useLive';
import { BandeauChrono, useChrono } from '../examen/Chrono';
import { BoutonTranscrire, DossierVue, NoteTranscription, TexteAuto, useEcoule } from './communs';
import { lireReglagesOral } from './Simulateur';

interface Prise {
  enregistrement?: Enregistrement;
  dictee?: Dictee;
  fichierId: string;
  debut: number;
  liberer: () => void;
}

/** Enregistrement en cours (micro + dictée facultative) ; une seule prise à la fois. */
function usePrise() {
  const prise = useRef<Prise>();
  const [enCours, setEnCours] = useState<number>();
  const [transcription, setTranscription] = useState('');
  const [avertissement, setAvertissement] = useState<string>();

  const demarrer = async (fichierId: string) => {
    setTranscription('');
    setAvertissement(undefined);
    const liberer = await garderEcranAllume();
    let enregistrement: Enregistrement | undefined;
    if (enregistrementPossible())
      try {
        enregistrement = await demarrerEnregistrement((partiel) => void enregistrerAudio(partiel, fichierId));
      } catch {
        setAvertissement('Micro inaccessible : autorise-le dans le navigateur. L’oral continue sans enregistrement.');
      }
    const dictee = lireReglagesOral().dictee ? demarrerDictee(setTranscription, setAvertissement) : undefined;
    const debut = Date.now();
    prise.current = { enregistrement, dictee, fichierId, debut, liberer };
    setEnCours(debut);
    return !!enregistrement;
  };

  /** Arrête la prise ; renvoie l'audio enregistré (s'il y en a), la transcription et la durée. */
  const arreter = async () => {
    const p = prise.current;
    prise.current = undefined;
    setEnCours(undefined);
    if (!p) return { dureeSec: 0, texte: '' };
    const texte = p.dictee?.arreter() ?? '';
    let audio: string | undefined;
    if (p.enregistrement) {
      const blob = await p.enregistrement.arreter();
      if (blob.size) audio = await enregistrerAudio(blob, p.fichierId);
    }
    p.liberer();
    return { audio, dureeSec: (Date.now() - p.debut) / 1000, texte: texte || transcription };
  };

  // En quittant l'écran : on coupe le micro (le fichier partiel reste enregistré).
  useEffect(
    () => () => {
      const p = prise.current;
      p?.dictee?.arreter();
      p?.enregistrement?.annuler();
      p?.liberer();
      arreterLecture();
    },
    [],
  );

  return { enCours, transcription, avertissement, demarrer, arreter };
}

/** Oral en cours : préparation, exposé enregistré, puis questions du jury. */
export function EpreuveOrale({ id, terminee }: { id: string; terminee: (id: string) => void }) {
  const oral = useLive(() => db.oraux.get(id), [id]);
  const m = oral ? minutage(oral) : undefined;
  const restant = useChrono(m?.debut ?? new Date().toISOString(), m?.dureeMin ?? 1, !oral);
  const prise = usePrise();
  const ecoule = useEcoule(prise.enCours);

  if (!oral || !m) return <section className="panneau" />;

  const terminer = async () => {
    if (!confirm('Terminer l’oral ? Tu pourras ensuite te réécouter et demander le bilan.')) return;
    const fin = prise.enCours ? await prise.arreter() : undefined;
    if (fin && oral.phase === 'expose') await finirExpose(oral, fin);
    await modifierOral(id, { phase: 'termine', fin: new Date().toISOString() });
    terminee(id);
  };

  return (
    <section className="panneau examen oral">
      <BandeauChrono restant={restant} dureeMin={m.dureeMin} libelle={oral.phase === 'preparation' ? 'de préparation' : 'd’épreuve'} />
      {oral.phase === 'preparation' && <Preparation oral={oral} restant={restant} commencer={(fichierId) => prise.demarrer(fichierId)} />}
      {oral.phase === 'expose' && <Expose oral={oral} prise={prise} ecoule={ecoule} />}
      {oral.phase === 'questions' && <Questions oral={oral} prise={prise} ecoule={ecoule} restant={restant} terminer={terminer} />}
      {(oral.phase === 'expose' || (oral.phase === 'questions' && !prise.enCours)) && (
        <button className="bouton large" onClick={terminer}>
          Arrêter l’oral ici
        </button>
      )}
    </section>
  );
}

async function finirExpose(oral: Oral, fin: { audio?: string; dureeSec: number; texte: string }) {
  await modifierOral(oral.id, {
    phase: 'questions',
    finExpose: new Date().toISOString(),
    exposeAudio: fin.audio ?? oral.exposeAudio,
    exposeDureeSec: fin.dureeSec || undefined,
    exposeTexte: fin.texte || oral.exposeTexte,
  });
}

function Preparation({ oral, restant, commencer }: { oral: Oral; restant: number; commencer: (fichierId: string) => Promise<boolean> }) {
  const [lancement, setLancement] = useState(false);
  return (
    <>
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">{oral.dossier.mode === 'theme' ? `Thème : ${oral.dossier.theme}` : 'Dossier'}</span>
        <span className="carte-sujet-intitule">{oral.dossier.consigne}</span>
      </div>
      <DossierVue dossier={oral.dossier} />
      <label className="libelle" htmlFor="notes-oral">
        Tes notes de préparation
      </label>
      <TexteAuto
        id="notes-oral"
        className="notes-oral"
        rows={10}
        initial={oral.notes}
        placeholder={'Identification, datation…\nProblématique\nI. …\nII. …'}
        enregistrer={(notes) => modifierOral(oral.id, { notes })}
      />
      <p className="discret">Ces notes servent de brouillon (comme au concours) et aident l’IA à te relancer.</p>
      {restant <= 0 && <p className="alerte-oral">Temps de préparation écoulé : le jury t’attend.</p>}
      <button
        className="bouton principal large grand"
        disabled={lancement}
        onClick={async () => {
          setLancement(true);
          const fichierId = crypto.randomUUID();
          await commencer(fichierId);
          await modifierOral(oral.id, { phase: 'expose', debutEpreuve: new Date().toISOString(), exposeAudio: fichierId });
        }}
      >
        🎙 Commencer l’exposé
      </button>
      <p className="discret">L’enregistrement et le chronomètre de l’épreuve démarrent. Garde l’écran allumé.</p>
    </>
  );
}

type PriseHook = ReturnType<typeof usePrise>;

function Indicateur({ prise, ecoule }: { prise: PriseHook; ecoule: number }) {
  return (
    <>
      {prise.enCours && (
        <p className="enregistrement-en-cours">
          <span className="point-rec" aria-hidden /> Enregistrement · {formatChrono(Math.round(ecoule))}
        </p>
      )}
      {prise.avertissement && <p className="discret erreur">{prise.avertissement}</p>}
      {prise.enCours && prise.transcription && <p className="transcription-direct">{prise.transcription}</p>}
    </>
  );
}

function Expose({ oral, prise, ecoule }: { oral: Oral; prise: PriseHook; ecoule: number }) {
  const exposeRestant = minutage(oral).exposeRestantSec ?? 0;
  const [fin, setFin] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <p className={`sous-chrono ${exposeRestant < 0 ? 'depasse' : exposeRestant < 60 ? 'fin-proche' : ''}`}>
        Exposé : {exposeRestant >= 0 ? `${formatChrono(exposeRestant)} restantes` : `dépassement de ${formatChrono(-exposeRestant)}`} (prévu {oral.dureeExposeMin} min)
      </p>
      <Indicateur prise={prise} ecoule={ecoule} />
      {!prise.enCours && <p className="discret">L’enregistrement a été interrompu (appli fermée ou rechargée) : le début est conservé. Termine ton exposé quand tu es prête.</p>}
      <button
        className="bouton principal large grand"
        disabled={fin}
        onClick={async () => {
          setFin(true);
          await finirExpose(oral, await prise.arreter());
        }}
      >
        ■ Terminer l’exposé
      </button>
      <details className="bloc" open>
        <summary>Tes notes</summary>
        <p className="texte-copie">{oral.notes || '—'}</p>
      </details>
      <details className="bloc">
        <summary>Le dossier</summary>
        <DossierVue dossier={oral.dossier} />
      </details>
    </>
  );
}

function Questions({ oral, prise, ecoule, restant, terminer }: { oral: Oral; prise: PriseHook; ecoule: number; restant: number; terminer: () => void }) {
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const [version, setVersion] = useState(0);
  const premiere = oral.questions.findIndex((q) => !q.audio && !q.texte);
  const [indice, setIndice] = useState(premiere < 0 ? Math.max(0, oral.questions.length - 1) : premiere);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [indice, oral.questions.length > 0]);

  const appeler = async (banque = false) => {
    setErreur(undefined);
    setAttente(true);
    try {
      const ia = !banque && iaPrete();
      const questions = ia ? await questionsJury(oral) : questionsDeBanque(oral.dossier);
      await modifierOral(oral.id, { questions, sourceQuestions: ia ? 'ia' : 'banque' });
      setIndice(0);
    } catch (e) {
      setErreur(await expliquerErreur(e));
    }
    setAttente(false);
  };

  if (!oral.questions.length)
    return (
      <>
        <p className="discret">
          Exposé terminé{oral.exposeDureeSec ? ` en ${formatChrono(Math.round(oral.exposeDureeSec))}` : ''}. {oral.exposeAudio ? 'Il est enregistré.' : ''}
        </p>
        <label className="libelle" htmlFor="resume-expose">
          Ton exposé en quelques lignes (facultatif)
        </label>
        {oral.exposeAudio && (
          <>
            <BoutonTranscrire
              fichierId={oral.exposeAudio}
              texte={oral.exposeTexte}
              vocabulaire={vocabulaireOral(oral)}
              libelle="Transcrire mon exposé"
              enregistrer={async (exposeTexte) => {
                await modifierOral(oral.id, { exposeTexte });
                setVersion((v) => v + 1);
              }}
            />
            <NoteTranscription />
          </>
        )}
        <TexteAuto
          key={`resume-${version}`}
          id="resume-expose"
          rows={6}
          initial={oral.exposeTexte}
          placeholder="Corrige la transcription ou résume ce que tu as dit. Sinon, le jury s’appuie sur tes notes."
          enregistrer={(exposeTexte) => modifierOral(oral.id, { exposeTexte })}
        />
        <button className="bouton principal large grand" disabled={attente} onClick={() => appeler()}>
          {attente ? 'Le jury prépare ses questions… (jusqu’à une minute)' : 'Passer aux questions du jury'}
        </button>
        {erreur && (
          <>
            <p className="erreur">{erreur}</p>
            <button className="bouton large" onClick={() => appeler(true)}>
              Continuer avec les questions de la banque
            </button>
          </>
        )}
      </>
    );

  const q = oral.questions[indice];
  const derniere = indice === oral.questions.length - 1;
  const majQuestion = (c: Partial<QuestionJury>) => modifierOral(oral.id, { questions: oral.questions.map((x, i) => (i === indice ? { ...x, ...c } : x)) });
  const repondue = !!(q.audio || q.texte);

  return (
    <>
      {restant <= 0 && <p className="alerte-oral">Temps d’épreuve écoulé : au concours, le jury te remercierait ici. Tu peux continuer pour t’entraîner.</p>}
      <div className="question-jury">
        <span className="carte-mot-categorie">
          Question {indice + 1} / {oral.questions.length} · {NOMS_CATEGORIES[q.categorie]}
          {oral.sourceQuestions === 'banque' && ' · banque'}
        </span>
        <p className="question-texte">{q.question}</p>
        {lecturePossible() && (
          <button className="lien" onClick={() => lireAVoixHaute(q.question)}>
            🔊 Écouter la question
          </button>
        )}
      </div>

      <Indicateur prise={prise} ecoule={ecoule} />

      {prise.enCours ? (
        <button
          className="bouton principal large grand"
          onClick={async () => {
            const fin = await prise.arreter();
            await majQuestion({ audio: fin.audio, dureeSec: fin.dureeSec, texte: fin.texte || q.texte });
          }}
        >
          ■ Fin de ma réponse
        </button>
      ) : (
        <button
          className={`bouton large grand ${repondue ? '' : 'principal'}`}
          onClick={() => {
            arreterLecture();
            prise.demarrer(q.audio ?? crypto.randomUUID());
          }}
        >
          🎙 {repondue ? 'Répondre à nouveau' : 'Répondre'}
        </button>
      )}

      {repondue && !prise.enCours && (
        <>
          <TexteAuto
            key={`${q.id}-${q.dureeSec ?? 0}`}
            rows={4}
            initial={q.texte ?? ''}
            placeholder="Facultatif : résume ta réponse (ou corrige la transcription) pour le bilan."
            enregistrer={(texte) => majQuestion({ texte })}
            aria-label="Ta réponse par écrit"
          />
          {q.attendu && (
            <details className="bloc attendu">
              <summary>Ce qu’attendait le jury</summary>
              <p>{q.attendu}</p>
            </details>
          )}
        </>
      )}

      {!prise.enCours && (
        <div className="actions">
          {indice > 0 && (
            <button className="bouton" onClick={() => setIndice(indice - 1)}>
              ← Précédente
            </button>
          )}
          {derniere ? (
            <button className="bouton principal" onClick={terminer}>
              Terminer l’oral
            </button>
          ) : (
            <button className={`bouton ${repondue ? 'principal' : ''}`} onClick={() => setIndice(indice + 1)}>
              {repondue ? 'Question suivante →' : 'Passer →'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
