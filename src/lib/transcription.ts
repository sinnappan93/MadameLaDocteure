/**
 * Transcription des enregistrements de l'oral, sur l'appareil (voir transcription.worker.ts).
 * Fonctionne dans la version web comme dans l'APK, hors ligne une fois le modèle téléchargé.
 */
import type { MessageDuWorker, MessageVersWorker } from './transcription.worker';

/** Taille approximative du modèle à télécharger la première fois. */
export const TAILLE_MODELE_MO = 80;
const ECHANTILLONNAGE = 16_000;
/** Whisper traite des fenêtres de 30 s : on découpe l'audio dans un silence proche de 28 s. */
const LONGUEUR_MORCEAU = 28 * ECHANTILLONNAGE;
const MARGE_COUPE = 4 * ECHANTILLONNAGE;

export interface Avancement {
  etape: 'telechargement' | 'transcription';
  /** 0 à 1. */
  part: number;
  texte?: string;
}

/** Audio mono à 16 kHz, décodé depuis l'enregistrement (WebM/Opus, MP4…). */
export async function decoderAudio(blob: Blob): Promise<Float32Array> {
  const Contexte = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Contexte({ sampleRate: ECHANTILLONNAGE });
  try {
    const tampon = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (tampon.numberOfChannels === 1) return tampon.getChannelData(0).slice();
    const a = tampon.getChannelData(0);
    const b = tampon.getChannelData(1);
    return a.map((x, i) => (x + b[i]) / 2);
  } finally {
    void ctx.close();
  }
}

/** Découpe l'audio en morceaux de 28 s au plus, en coupant au moment le plus calme autour de la limite. */
export function decouper(audio: Float32Array): Float32Array[] {
  const morceaux: Float32Array[] = [];
  let debut = 0;
  while (audio.length - debut > LONGUEUR_MORCEAU) {
    const cible = debut + LONGUEUR_MORCEAU;
    let meilleur = cible;
    let energieMin = Infinity;
    const fenetre = ECHANTILLONNAGE / 10;
    for (let i = cible - MARGE_COUPE; i < cible; i += fenetre) {
      let e = 0;
      for (let k = i; k < i + fenetre; k++) e += audio[k] * audio[k];
      if (e < energieMin) {
        energieMin = e;
        meilleur = i + fenetre / 2;
      }
    }
    morceaux.push(audio.slice(debut, meilleur));
    debut = meilleur;
  }
  if (audio.length - debut > ECHANTILLONNAGE / 4) morceaux.push(audio.slice(debut));
  return morceaux;
}

let worker: Worker | undefined;
let compteur = 0;

/** Transcrit un enregistrement ; `suivre` reçoit l'avancement (téléchargement du modèle, puis morceaux). */
export async function transcrire(blob: Blob, suivre: (a: Avancement) => void = () => undefined, vocabulaire?: string): Promise<string> {
  // Pour les tests de bout en bout : une transcription factice, sans télécharger le modèle.
  const factice = (globalThis as { __transcriptionFactice?: (b: Blob) => Promise<string> }).__transcriptionFactice;
  if (factice) return factice(blob);
  const morceaux = decouper(await decoderAudio(blob));
  if (!morceaux.length) return '';
  worker ??= new Worker(new URL('./transcription.worker.ts', import.meta.url), { type: 'module' });
  const id = ++compteur;
  const racine = new URL('./', document.baseURI).href;
  return new Promise<string>((ok, ko) => {
    const w = worker!;
    const ecoute = (e: MessageEvent<MessageDuWorker>) => {
      const m = e.data;
      if (m.id !== id) return;
      if (m.type === 'telechargement') suivre({ etape: 'telechargement', part: m.total ? m.charge / m.total : 0 });
      else if (m.type === 'morceau') suivre({ etape: 'transcription', part: m.index / m.total, texte: m.texte });
      else {
        w.removeEventListener('message', ecoute);
        if (m.type === 'fini') ok(m.texte);
        else ko(new Error(m.message));
      }
    };
    w.addEventListener('message', ecoute);
    w.postMessage({ type: 'transcrire', id, morceaux, racine, vocabulaire } satisfies MessageVersWorker, morceaux.map((m) => m.buffer));
  });
}
