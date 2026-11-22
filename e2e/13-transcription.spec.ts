/**
 * Transcription des enregistrements de l'oral, sur l'appareil.
 * Par défaut, transcription factice (pas de téléchargement) ; avec TRANSCRIPTION_REELLE=1, vrai modèle Whisper sur un
 * exposé en français (e2e/fixtures/expose-fr.webm, voix de synthèse Piper « siwis », texte dans expose-fr.txt).
 */
import { readFileSync } from 'node:fs';
import { activerIA, ecrire, expect, lireTout, menu, test } from './outils';
import type { Oral } from '../src/domain/oral';

const audio = readFileSync(new URL('./fixtures/expose-fr.webm', import.meta.url)).toString('base64');

/** Un oral terminé, avec l'exposé enregistré (fichier audio réel) et une réponse enregistrée. */
async function oralEnregistre(page: import('@playwright/test').Page) {
  await page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:audio/webm;base64,${b64}`)).blob();
    await new Promise<void>((ok) => {
      const r = indexedDB.open('madameladocteure');
      r.onsuccess = () => {
        const tx = r.result.transaction('fichiers', 'readwrite');
        tx.objectStore('fichiers').put({ id: 'audio-expose', blob });
        tx.objectStore('fichiers').put({ id: 'audio-reponse', blob });
        tx.oncomplete = () => ok();
      };
    });
  }, audio);
  const oral: Partial<Oral> = {
    id: 'oral-test',
    dossier: {
      mode: 'oeuvres',
      documents: [{ oeuvreId: 'ref-x', titre: 'Bouddha prêchant de Sarnath', datation: 'Ve s., époque gupta', site: 'Sarnath', conservation: 'Musée de Sarnath', materiau: 'Grès de Chunar' }],
      sansCartels: false,
      consigne: 'Présente ce dossier',
    },
    dureePrepMin: 30,
    dureeEpreuveMin: 30,
    dureeExposeMin: 10,
    phase: 'termine',
    debut: '2026-11-23T08:00:00.000Z',
    fin: '2026-11-23T09:00:00.000Z',
    notes: 'Gupta, Sarnath, dharmacakra-mudrā, Chunar',
    exposeAudio: 'audio-expose',
    exposeTexte: '',
    questions: [{ id: 'q1', categorie: 'motivation', question: 'Pourquoi ce métier ?', attendu: '', audio: 'audio-reponse' }],
    modifieLe: '2026-11-23T09:00:00.000Z',
  };
  await ecrire(page, { oraux: [oral] });
  await menu(page, 'Simulateur d’oral');
  await page.locator('.copie-ligne').first().click();
}

test('transcription factice : le texte remplit l’exposé et la réponse, puis le bilan devient possible', async ({ appli }) => {
  await appli.addInitScript(() => {
    (globalThis as { __transcriptionFactice?: (b: Blob) => Promise<string> }).__transcriptionFactice = async (b) => `Transcription de ${b.size} octets.`;
  });
  await appli.reload();
  await activerIA(appli);
  await oralEnregistre(appli);
  await expect(appli.getByRole('button', { name: 'Demander le bilan du jury' })).toBeDisabled();
  await expect(appli.getByText(/La transcription se fait sur ton appareil/)).toBeVisible();
  await appli.getByRole('button', { name: '✎ Transcrire l’enregistrement' }).click();
  await expect(appli.getByLabel('Transcription ou résumé de l’exposé')).toHaveValue(/^Transcription de \d+ octets\.$/);
  await appli.getByRole('button', { name: '✎ Transcrire la réponse' }).click();
  await expect(appli.getByLabel('Réponse à la question 1')).toHaveValue(/^Transcription de/);
  const oral = (await lireTout<Oral>(appli, 'oraux'))[0];
  expect(oral.exposeTexte).toMatch(/^Transcription de/);
  expect(oral.questions[0].texte).toMatch(/^Transcription de/);
  await expect(appli.getByRole('button', { name: 'Demander le bilan du jury' })).toBeEnabled();
});

test('transcription réelle (Whisper sur l’appareil) d’un exposé en français', async ({ appli }) => {
  test.skip(!process.env.TRANSCRIPTION_REELLE, 'Télécharge le modèle (environ 80 Mo) : lancer avec TRANSCRIPTION_REELLE=1');
  test.setTimeout(600_000);
  await oralEnregistre(appli);
  const debut = Date.now();
  await appli.getByRole('button', { name: '✎ Transcrire l’enregistrement' }).click();
  const suivi = setInterval(async () => console.log('…', await appli.locator('.transcription').first().innerText().catch(() => '')), 15_000);
  await expect(appli.getByLabel('Transcription ou résumé de l’exposé')).not.toHaveValue('', { timeout: 540_000 }).finally(() => clearInterval(suivi));
  const texte = await appli.getByLabel('Transcription ou résumé de l’exposé').inputValue();
  console.log(`Transcription en ${Math.round((Date.now() - debut) / 1000)} s : ${texte}`);
  for (const mot of [/bouddha/i, /sarnath/i, /gupta/i, /grès/i, /problématique/i]) expect(texte).toMatch(mot);
  // Deuxième fois : modèle en cache, sans téléchargement.
  const t2 = Date.now();
  await appli.getByRole('button', { name: '✎ Transcrire la réponse' }).click();
  await expect(appli.getByLabel('Réponse à la question 1')).not.toHaveValue('', { timeout: 300_000 });
  console.log(`Deuxième transcription (modèle en cache) en ${Math.round((Date.now() - t2) / 1000)} s`);
});
