import { activerIA, compter, expect, lireTout, menu, photo, test } from './outils';

test('sujet blanc tapé : chronomètre, sauvegarde, reprise après rechargement, correction par l’IA', async ({ appli, reseau }) => {
  await activerIA(appli);
  await menu(appli, 'Sujets blancs');
  await appli.getByRole('radio', { name: 'Culture générale' }).click();
  await appli.getByRole('radio', { name: '1 h', exact: true }).click();
  const sujet = await appli.locator('.carte-sujet-intitule').innerText();
  await appli.getByRole('button', { name: /Commencer · 1 h/ }).click();
  await expect(appli.locator('.chrono-valeur')).toHaveText(/^(1:00:00|59:5\d)$/);
  await appli.locator('.copie-texte').fill('Introduction. Le patrimoine se définit comme un bien commun transmis.');
  await expect(appli.getByText('Enregistré')).toBeVisible();
  await expect(appli.getByText(/10 mots/)).toBeVisible();
  // 25 minutes plus tard, l'appli est rouverte.
  await appli.clock.fastForward('25:00');
  await appli.reload();
  await menu(appli, 'Mes copies et corrections');
  await expect(appli.locator('.etat-copie').first()).toHaveText('En cours : reprendre');
  await appli.locator('.copie-ligne').first().click();
  await expect(appli.locator('.copie-texte')).toHaveValue(/^Introduction\. Le patrimoine/);
  // Non-régression : pas de valeur provisoire (01:00) affichée après le rechargement.
  await expect(appli.locator('.chrono-valeur')).toHaveText(/^3[45]:\d\d$/);
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await expect(appli.locator('.carte-sujet-intitule')).toHaveText(sujet);
  await appli.getByRole('button', { name: 'Faire corriger ma copie' }).click();
  await expect(appli.locator('.note-globale')).toContainText('13,5');
  await expect(appli.locator('.critere-correction')).toHaveCount(5);
  expect(reseau.appelsIA).toHaveLength(1);
  expect(reseau.appelsIA[0]).toMatchObject({ type: 'correction', modele: 'claude-opus-5-5', effort: 'high', fallbacks: 'default', images: 0 });
  expect(reseau.appelsIA[0].beta).toContain('server-side-fallback-2026-07-01');
  expect(reseau.appelsIA[0].texte).toContain('Le patrimoine se définit');
  await menu(appli, 'Mes copies et corrections');
  await expect(appli.locator('.etat-copie').first()).toHaveText('Corrigée · 13,5/20');
});

test('copie manuscrite : photos des pages envoyées à l’IA', async ({ appli, reseau }) => {
  await activerIA(appli);
  await menu(appli, 'Sujets blancs');
  await appli.getByRole('radio', { name: 'Sur papier' }).click();
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await expect(appli.getByRole('button', { name: 'Faire corriger ma copie' })).toBeDisabled();
  await appli.locator('.depot-photo input').setInputFiles(photo('page1.png'));
  await expect(appli.locator('.page-copie')).toHaveCount(1);
  await appli.locator('.depot-photo input').setInputFiles(photo('page2.png'));
  await expect(appli.locator('.page-copie')).toHaveCount(2);
  await appli.getByRole('button', { name: 'Faire corriger ma copie' }).click();
  await expect(appli.locator('.note-globale')).toBeVisible();
  expect(reseau.appelsIA[0]).toMatchObject({ type: 'correction', images: 2 });
});

test('plan en 15 minutes : commentaire et plan de comparaison', async ({ appli, reseau }) => {
  await activerIA(appli);
  await menu(appli, 'Plan en 15 minutes');
  await expect(appli.getByRole('radio', { name: 'Synthèse' })).toHaveCount(0);
  await appli.getByRole('button', { name: /Commencer · 15 min/ }).click();
  await appli.getByLabel('Problématique').fill('En quoi l’image du Bouddha naît-elle de plusieurs foyers ?');
  await appli.getByLabel('Plan détaillé').fill('I. Mathurā\nII. Gandhāra');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await appli.getByRole('button', { name: 'Faire commenter mon plan' }).click();
  await expect(appli.locator('.plan-propose .partie')).toHaveCount(2);
  expect(reseau.appelsIA[0]).toMatchObject({ type: 'plan', effort: 'medium' });
  expect(reseau.appelsIA[0].texte).toContain('plusieurs foyers');
});

test('banque de sujets : sujet de jury, génération par l’IA sans doublon, s’entraîner', async ({ appli, reseau }) => {
  await activerIA(appli);
  await menu(appli, 'Banque de sujets');
  await expect(appli.locator('.compteur')).toHaveText(/^[1-9]\d* sujet/); // banque chargée
  const avant = Number((await appli.locator('.compteur').innerText()).match(/\d+/)![0]);
  await appli.getByRole('button', { name: '+ Ajouter un sujet' }).click();
  await appli.getByLabel('Intitulé').fill('Sujet du rapport de jury (test)');
  await appli.getByLabel('Précision').fill('Session 2022');
  await appli.getByRole('button', { name: 'Enregistrer le sujet' }).click();
  await expect(appli.locator('.compteur')).toHaveText(`${avant + 1} sujet(s)`);
  await appli.locator('.generation summary').click();
  await appli.getByRole('button', { name: 'Générer' }).click();
  await expect(appli.locator('.sujet-genere')).toHaveCount(2); // le doublon renvoyé par l'IA est écarté
  await appli.locator('.sujet-genere').first().getByRole('button', { name: 'Garder' }).click();
  await expect(appli.locator('.compteur')).toHaveText(`${avant + 2} sujet(s)`);
  expect(reseau.appelsIA.map((a) => a.type)).toEqual(['sujets']);
  await appli.locator('.sujet', { hasText: 'Sujet du rapport de jury (test)' }).getByRole('button', { name: 'S’entraîner' }).click();
  await expect(appli.locator('.carte-sujet-intitule')).toHaveText('Sujet du rapport de jury (test)');
});

test('note d’un correcteur : elle prime sur celle de l’IA', async ({ appli }) => {
  await activerIA(appli);
  await menu(appli, 'Sujets blancs');
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.locator('.copie-texte').fill('Ma copie.');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await appli.getByRole('button', { name: 'Faire corriger ma copie' }).click();
  await expect(appli.locator('.note-globale')).toBeVisible();
  await appli.getByRole('button', { name: '+ Ajouter la note du correcteur' }).click();
  await appli.getByLabel('Note sur 20').fill('11,5');
  await appli.getByLabel('Correcteur').fill('Prépa');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(appli.locator('.note-correcteur')).toContainText('11,5/20');
  await menu(appli, 'Mes copies et corrections');
  await expect(appli.locator('.etat-copie').first()).toHaveText('Corrigée · 11,5/20 (correcteur)');
});

test('IA : clé refusée → message clair ; IA désactivée → invitation aux réglages', async ({ appli, reseau, erreurs }) => {
  await menu(appli, 'Plan en 15 minutes');
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.getByLabel('Problématique').fill('Test');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await expect(appli.getByText('À activer dans Menu › Réglages › Intelligence artificielle (clé d’API et accord).')).toBeVisible();
  await activerIA(appli);
  reseau.erreurIA = 401;
  await appli.reload();
  await menu(appli, 'Mes copies et corrections');
  await appli.locator('.copie-ligne').first().click();
  await appli.getByRole('button', { name: 'Faire commenter mon plan' }).click();
  await expect(appli.locator('.erreur')).toHaveText('Clé d’API refusée : vérifie-la dans Menu › Réglages › Intelligence artificielle.');
  expect(await lireTout<{ commentairePlan?: unknown }>(appli, 'copies').then((c) => c[0].commentairePlan)).toBeUndefined();
  // Le navigateur signale la réponse 401 attendue : ce n'est pas une erreur de l'appli.
  const attendues = erreurs.filter((e) => e.includes('status of 401'));
  expect(attendues.length).toBeGreaterThan(0);
  erreurs.splice(0, erreurs.length, ...erreurs.filter((e) => !attendues.includes(e)));
});

test('supprimer une copie supprime ses photos', async ({ appli }) => {
  await menu(appli, 'Sujets blancs');
  await appli.getByRole('radio', { name: 'Sur papier' }).click();
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  const avant = await compter(appli, 'fichiers');
  await appli.locator('.depot-photo input').setInputFiles(photo('p.png'));
  await expect.poll(() => compter(appli, 'fichiers')).toBe(avant + 1);
  await appli.getByRole('button', { name: 'Supprimer' }).click();
  await expect.poll(() => compter(appli, 'fichiers')).toBe(avant);
  expect(await compter(appli, 'copies')).toBe(0);
});
