import { activerIA, compter, expect, lireTout, menu, test } from './outils';
import type { Oral } from '../src/domain/oral';

test('oral blanc complet avec l’IA : dossier, préparation, exposé enregistré, questions, réécoute, bilan', async ({ appli, reseau }) => {
  await activerIA(appli);
  await menu(appli, 'Simulateur d’oral');
  await appli.getByRole('button', { name: /Tirer le dossier et préparer · 30 min/ }).click();
  await expect(appli.locator('.chrono-etat')).toHaveText('de préparation');
  await expect(appli.locator('.doc-oral')).toHaveCount(3);
  await expect(appli.locator('.doc-oral img')).toHaveCount(3);
  await appli.locator('#notes-oral').fill('Problématique de test\nI. …\nII. …');
  await appli.locator('#notes-oral').blur();
  // L'appli est fermée pendant la préparation, puis rouverte.
  await appli.reload();
  await menu(appli, 'Simulateur d’oral');
  await expect(appli.locator('.etat-copie').first()).toHaveText('En cours : reprendre');
  await appli.locator('.copie-ligne').first().click();
  await expect(appli.locator('#notes-oral')).toHaveValue(/Problématique de test/);
  // Exposé enregistré.
  await appli.getByRole('button', { name: /Commencer l’exposé/ }).click();
  await expect(appli.locator('.enregistrement-en-cours')).toBeVisible();
  await expect(appli.locator('.chrono-etat')).toHaveText('d’épreuve');
  await expect(appli.locator('.sous-chrono')).toContainText('(prévu 10 min)');
  await appli.waitForTimeout(2500);
  await appli.getByRole('button', { name: /Terminer l’exposé/ }).click();
  await expect(appli.getByText(/Il est enregistré\./)).toBeVisible();
  await appli.locator('#resume-expose').fill('Résumé de test');
  await appli.locator('#resume-expose').blur();
  await appli.getByRole('button', { name: 'Passer aux questions du jury' }).click();
  await expect(appli.locator('.question-jury')).toContainText('Question 1 / 4');
  for (let i = 0; i < 2; i++) {
    await appli.getByRole('button', { name: /^🎙 Répondre$/ }).click();
    await expect(appli.locator('.enregistrement-en-cours')).toBeVisible();
    await appli.waitForTimeout(1200);
    await appli.getByRole('button', { name: /Fin de ma réponse/ }).click();
    if (i === 1) await appli.getByLabel('Ta réponse par écrit').fill('Réponse écrite de test');
    await appli.locator('.attendu summary').click();
    await expect(appli.locator('.attendu p')).toBeVisible();
    await appli.getByRole('button', { name: /Question suivante/ }).click();
  }
  await appli.getByRole('button', { name: /Passer/ }).click();
  await appli.getByRole('button', { name: 'Terminer l’oral' }).last().click();
  // Réécoute : 3 enregistrements, de durée connue (non-régression WebM sans durée).
  await expect(appli.locator('audio')).toHaveCount(3);
  await expect
    .poll(() => appli.locator('audio').evaluateAll((as) => as.map((a) => (a as HTMLAudioElement).duration)))
    .toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
  const durees = await appli.locator('audio').evaluateAll((as) => as.map((a) => (a as HTMLAudioElement).duration));
  expect(durees.every((d) => Number.isFinite(d) && d > 0.5)).toBe(true);
  await appli.getByRole('button', { name: 'Demander le bilan du jury' }).click();
  await expect(appli.locator('.note-globale')).toContainText('14');
  expect(reseau.appelsIA.map((a) => [a.type, a.effort])).toEqual([
    ['questions', 'medium'],
    ['bilan', 'high'],
  ]);
  expect(reseau.appelsIA[0].texte).toContain('Problématique de test');
  expect(reseau.appelsIA[0].texte).toContain('Résumé de test');
  expect(reseau.appelsIA[1].texte).toContain('Réponse écrite de test');
  await menu(appli, 'Simulateur d’oral');
  await expect(appli.locator('.etat-copie').first()).toHaveText('Bilan · 14/20');
});

test('sans IA, cartels masqués : questions de la banque, aucune œuvre nommée', async ({ appli, reseau }) => {
  await menu(appli, 'Simulateur d’oral');
  await appli.getByRole('checkbox', { name: /Masquer les cartels/ }).check();
  await appli.getByRole('radio', { name: '20 min', exact: true }).first().click();
  await appli.getByRole('button', { name: /Tirer le dossier et préparer · 20 min/ }).click();
  await expect(appli.locator('.doc-oral figcaption')).toHaveText(['Document 1', 'Document 2', 'Document 3']);
  const titres = (await lireTout<Oral>(appli, 'oraux'))[0].dossier.documents.map((d) => d.titre);
  await appli.getByRole('button', { name: /Commencer l’exposé/ }).click();
  await appli.getByRole('button', { name: /Terminer l’exposé/ }).click();
  await appli.getByRole('button', { name: 'Passer aux questions du jury' }).click();
  await expect(appli.locator('.question-jury')).toContainText('Question 1 / 8');
  const oral = (await lireTout<Oral>(appli, 'oraux'))[0];
  expect(oral.sourceQuestions).toBe('banque');
  expect(oral.questions.map((q) => q.categorie)).toEqual(['relance', 'relance', 'relance', 'relance', 'motivation', 'situation', 'situation', 'situation']);
  expect(oral.questions.some((q) => titres.some((t) => q.question.includes(t)))).toBe(false);
  expect(oral.dureePrepMin).toBe(20);
  expect(reseau.appelsIA).toHaveLength(0);
  // Sans texte, pas de bilan possible : l'IA n'écoute pas l'audio.
  await appli.getByRole('button', { name: 'Arrêter l’oral ici' }).click();
  await expect(appli.getByText('Écris d’abord au moins un résumé de ton exposé ou d’une réponse.')).toBeVisible();
});

test('dossier sur un thème, avec les œuvres de mes fiches liées', async ({ appli }) => {
  await menu(appli, 'Simulateur d’oral');
  await appli.getByRole('radio', { name: 'Un thème' }).click();
  await appli.getByRole('combobox', { name: 'Thème' }).selectOption('th-angkor');
  await appli.getByRole('button', { name: /Tirer le dossier/ }).click();
  await expect(appli.locator('.carte-sujet-intitule')).toContainText('« Angkor et l’art khmer »');
  const docs = await appli.locator('.doc-oral figcaption > span:not(.discret)').allInnerTexts();
  expect(docs).toHaveLength(3);
  expect(docs.join(' ')).toMatch(/Angkor|Bayon|Jayavarman|khmer/i);
});

test('format réglable et retour au format de 2015 ; suppression d’un oral et de ses enregistrements', async ({ appli }) => {
  await menu(appli, 'Simulateur d’oral');
  await appli.getByRole('radiogroup', { name: 'Préparation' }).getByRole('radio', { name: '45 min' }).click();
  await appli.getByRole('button', { name: 'Revenir au format de 2015' }).click();
  await expect(appli.getByRole('radiogroup', { name: 'Préparation' }).getByRole('radio', { name: '30 min' })).toHaveAttribute('aria-checked', 'true');
  await appli.getByRole('button', { name: /Tirer le dossier/ }).click();
  await appli.getByRole('button', { name: /Commencer l’exposé/ }).click();
  await appli.waitForTimeout(1500);
  await appli.getByRole('button', { name: /Terminer l’exposé/ }).click();
  await expect.poll(() => lireTout<{ blob: Blob }>(appli, 'fichiers').then(async () => (await lireTout<Oral>(appli, 'oraux'))[0].exposeAudio)).toBeTruthy();
  const fichiers = await compter(appli, 'fichiers');
  await appli.getByRole('button', { name: 'Arrêter l’oral ici' }).click();
  await appli.getByRole('button', { name: 'Supprimer' }).click();
  await expect.poll(() => compter(appli, 'oraux')).toBe(0);
  expect(await compter(appli, 'fichiers')).toBe(fichiers - 1);
});
