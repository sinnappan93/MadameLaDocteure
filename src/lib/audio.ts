/**
 * Audio du simulateur d'oral : enregistrement (MediaRecorder), transcription par la dictée du navigateur (facultative),
 * lecture des questions à voix haute, et maintien de l'écran allumé pendant l'épreuve.
 */

const FORMATS = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];

export const enregistrementPossible = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export interface Enregistrement {
  /** Arrête et renvoie le fichier complet. */
  arreter: () => Promise<Blob>;
  /** Abandonne sans rien garder. */
  annuler: () => void;
}

/**
 * Démarre un enregistrement du micro. `sauvegarde` reçoit régulièrement le fichier partiel,
 * pour ne pas tout perdre si l'appli se ferme en cours d'exposé.
 */
export async function demarrerEnregistrement(sauvegarde?: (partiel: Blob) => void, intervalleMs = 15_000): Promise<Enregistrement> {
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mimeType = FORMATS.find((f) => MediaRecorder.isTypeSupported?.(f));
  const enregistreur = new MediaRecorder(flux, mimeType ? { mimeType } : undefined);
  const morceaux: Blob[] = [];
  const type = () => enregistreur.mimeType || mimeType || 'audio/webm';
  let derniere = Date.now();
  enregistreur.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
    if (sauvegarde && Date.now() - derniere >= intervalleMs) {
      derniere = Date.now();
      sauvegarde(new Blob(morceaux, { type: type() }));
    }
  };
  enregistreur.start(1000);
  const liberer = () => flux.getTracks().forEach((p) => p.stop());
  return {
    arreter: () =>
      new Promise<Blob>((ok) => {
        enregistreur.onstop = () => {
          liberer();
          ok(new Blob(morceaux, { type: type() }));
        };
        if (enregistreur.state === 'inactive') enregistreur.onstop(new Event('stop'));
        else enregistreur.stop();
      }),
    annuler: () => {
      enregistreur.onstop = null;
      if (enregistreur.state !== 'inactive') enregistreur.stop();
      liberer();
    },
  };
}

// ——— Dictée (Web Speech API) ———

interface ResultatDictee {
  isFinal: boolean;
  0: { transcript: string };
}
interface Reconnaissance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ResultatDictee> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type ConstructeurReconnaissance = new () => Reconnaissance;

const constructeurDictee = (): ConstructeurReconnaissance | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: ConstructeurReconnaissance; webkitSpeechRecognition?: ConstructeurReconnaissance };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const dicteePossible = () => !!constructeurDictee();

export interface Dictee {
  /** Arrête et renvoie le texte reconnu. */
  arreter: () => string;
}

/**
 * Transcrit en continu (français). La reconnaissance s'arrête d'elle-même après un silence : on la relance.
 * `suivre` reçoit le texte au fil de l'eau ; `erreur` signale un échec (micro occupé, service indisponible…).
 */
export function demarrerDictee(suivre: (texte: string) => void, erreur: (message: string) => void): Dictee | undefined {
  const C = constructeurDictee();
  if (!C) return undefined;
  let final = '';
  let actif = true;
  let echecs = 0;
  const r = new C();
  r.lang = 'fr-FR';
  r.continuous = true;
  r.interimResults = true;
  r.onresult = (e) => {
    echecs = 0;
    let provisoire = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) final = `${final} ${res[0].transcript.trim()}`.trim();
      else provisoire += res[0].transcript;
    }
    suivre(`${final} ${provisoire.trim()}`.trim());
  };
  r.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    echecs++;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture' || echecs > 3) {
      actif = false;
      erreur(
        e.error === 'audio-capture'
          ? 'Transcription impossible pendant l’enregistrement sur cet appareil : l’audio est bien enregistré, tu pourras résumer à l’écrit.'
          : 'Transcription indisponible : l’audio est bien enregistré, tu pourras résumer à l’écrit.',
      );
    }
  };
  r.onend = () => {
    if (actif)
      try {
        r.start();
      } catch {
        /* déjà relancée */
      }
  };
  try {
    r.start();
  } catch {
    return undefined;
  }
  return {
    arreter: () => {
      actif = false;
      try {
        r.stop();
      } catch {
        /* déjà arrêtée */
      }
      return final;
    },
  };
}

// ——— Lecture à voix haute ———

export const lecturePossible = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function lireAVoixHaute(texte: string) {
  if (!lecturePossible()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = 'fr-FR';
  const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith('fr'));
  if (voix) u.voice = voix;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

export const arreterLecture = () => lecturePossible() && speechSynthesis.cancel();

// ——— Écran allumé ———

interface Verrou {
  release: () => Promise<void>;
}

/** Empêche l'écran de se mettre en veille (ce qui couperait l'enregistrement sur téléphone). Renvoie la fonction pour le libérer. */
export async function garderEcranAllume(): Promise<() => void> {
  try {
    const nav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Verrou> } };
    const verrou = await nav.wakeLock?.request('screen');
    return () => void verrou?.release().catch(() => undefined);
  } catch {
    return () => undefined;
  }
}
