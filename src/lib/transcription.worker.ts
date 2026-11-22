/**
 * Transcription sur l'appareil (Whisper, via transformers.js et ONNX Runtime en WebAssembly), dans un worker pour ne
 * pas bloquer l'appli. Le modèle est téléchargé une fois puis gardé dans le cache du navigateur : ensuite, tout se fait
 * hors ligne et rien n'est envoyé. Une amorce de vocabulaire (noms du dossier, notes) aide à reconnaître les noms propres.
 */
import { AutoProcessor, AutoTokenizer, env, type PreTrainedTokenizer, type Processor, type Tensor, WhisperForConditionalGeneration } from '@huggingface/transformers';

export const MODELE_TRANSCRIPTION = 'onnx-community/whisper-base';

export type MessageVersWorker = { type: 'transcrire'; id: number; morceaux: Float32Array[]; racine: string; vocabulaire?: string };
export type MessageDuWorker =
  | { type: 'telechargement'; id: number; charge: number; total: number }
  | { type: 'morceau'; id: number; index: number; total: number; texte: string }
  | { type: 'fini'; id: number; texte: string }
  | { type: 'erreur'; id: number; message: string };

interface Outils {
  processeur: Processor;
  tokenizer: PreTrainedTokenizer;
  modele: WhisperForConditionalGeneration;
}
let outils: Promise<Outils> | undefined;

function charger(racine: string, progression: (charge: number, total: number) => void): Promise<Outils> {
  if (outils) return outils;
  // ONNX Runtime est livré avec l'appli (dossier ort/) : pas de CDN, fonctionne hors ligne et dans l'APK.
  env.backends.onnx.wasm!.wasmPaths = `${racine}ort/`;
  env.allowLocalModels = false;
  const fichiers = new Map<string, { charge: number; total: number }>();
  const progress_callback = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status !== 'progress' || !p.file) return;
    fichiers.set(p.file, { charge: p.loaded ?? 0, total: p.total ?? 0 });
    const t = [...fichiers.values()].reduce((a, f) => ({ charge: a.charge + f.charge, total: a.total + f.total }), { charge: 0, total: 0 });
    progression(t.charge, t.total);
  };
  outils = (async () => {
    const [processeur, tokenizer, modele] = await Promise.all([
      AutoProcessor.from_pretrained(MODELE_TRANSCRIPTION, { progress_callback }),
      AutoTokenizer.from_pretrained(MODELE_TRANSCRIPTION, { progress_callback }),
      WhisperForConditionalGeneration.from_pretrained(MODELE_TRANSCRIPTION, {
        device: 'wasm',
        dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
        progress_callback,
      }) as Promise<WhisperForConditionalGeneration>,
    ]);
    return { processeur, tokenizer, modele };
  })();
  outils.catch(() => (outils = undefined));
  return outils;
}

/** Début de la séquence du décodeur : amorce éventuelle, puis français, transcription, sans horodatage. */
function debutSequence(tokenizer: PreTrainedTokenizer, vocabulaire?: string): number[] {
  const id = (t: string) => {
    const v = (tokenizer as unknown as { model: { tokens_to_ids: Map<string, number> } }).model.tokens_to_ids.get(t);
    if (v === undefined) throw new Error(`Jeton inconnu : ${t}`);
    return v;
  };
  const amorce = vocabulaire?.trim() ? [id('<|startofprev|>'), ...tokenizer.encode(` ${vocabulaire.trim()}`, { add_special_tokens: false }).slice(0, 180)] : [];
  return [...amorce, id('<|startoftranscript|>'), id('<|fr|>'), id('<|transcribe|>'), id('<|notimestamps|>')];
}

const poster = (m: MessageDuWorker) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<MessageVersWorker>) => {
  const { id, morceaux, racine, vocabulaire } = e.data;
  try {
    const { processeur, tokenizer, modele } = await charger(racine, (charge, total) => poster({ type: 'telechargement', id, charge, total }));
    const debut = debutSequence(tokenizer, vocabulaire);
    const textes: string[] = [];
    for (const [index, audio] of morceaux.entries()) {
      const entrees = await processeur(audio);
      const sortie = (await modele.generate({ ...entrees, decoder_input_ids: debut, max_new_tokens: 440 - debut.length } as never)) as Tensor;
      const jetons = (sortie.tolist() as Array<Array<number | bigint>>)[0].map(Number).slice(debut.length);
      textes.push(tokenizer.decode(jetons, { skip_special_tokens: true }).trim());
      poster({ type: 'morceau', id, index: index + 1, total: morceaux.length, texte: textes.join(' ') });
    }
    poster({ type: 'fini', id, texte: textes.join(' ').replace(/\s+/g, ' ').trim() });
  } catch (err) {
    poster({ type: 'erreur', id, message: err instanceof Error ? err.message : String(err) });
  }
};
