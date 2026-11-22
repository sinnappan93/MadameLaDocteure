import { REFERENCES } from '../src/data/references';
import { compter, expect, lireTout, menu, photo, test } from './outils';

test('fiches préparées : 51 fiches, 50 images téléchargées avec leurs crédits', async ({ appli }) => {
  const images = await lireTout<{ source: string; licence?: string; auteur?: string; fichierId?: string }>(appli, 'images');
  expect(images.filter((i) => i.source === 'commons')).toHaveLength(50);
  expect(images.every((i) => i.fichierId && i.licence === 'CC BY-SA 4.0' && i.auteur === 'Auteur test')).toBe(true);
  await menu(appli, 'Œuvres de référence');
  await expect(appli.locator('.compteur')).toHaveText('51 œuvre(s)');
});

test('liste : filtre par aire et recherche', async ({ appli }) => {
  await menu(appli, 'Œuvres de référence');
  const cambodge = REFERENCES.filter((r) => r.aireId === 'cambodge').length;
  await appli.getByLabel('Aire culturelle').selectOption('cambodge');
  await expect(appli.locator('.compteur')).toHaveText(`${cambodge} œuvre(s)`);
  await appli.getByLabel('Aire culturelle').selectOption('');
  await appli.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill('Sarnath');
  await expect(appli.locator('.carte-titre').first()).toContainText('Sarnath');
});

test('fiche : détails, image, comparaisons et vocabulaire', async ({ appli }) => {
  await menu(appli, 'Œuvres de référence');
  await appli.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill('Bouddha prêchant de Sarnath');
  await appli.locator('.carte-oeuvre').first().click();
  await expect(appli.locator('h2').first()).toHaveText('Bouddha prêchant de Sarnath');
  await expect(appli.getByText('Fiche préparée · à vérifier avec tes sources')).toBeVisible();
  await expect(appli.locator('img').first()).toBeVisible();
  await expect(appli.getByText('Dans les musées')).toBeVisible();
});

test('créer une fiche avec une photo, la modifier puis la supprimer', async ({ appli }) => {
  await menu(appli, 'Œuvres de référence');
  await appli.getByLabel('Nouvelle fiche').click();
  await appli.getByLabel('Titre *').fill('Stèle de test');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(appli.locator('h2').first()).toHaveText('Stèle de test');
  // Photo personnelle.
  await appli.getByRole('button', { name: /Ajouter une image|Trouver une image/ }).first().click();
  await appli.getByRole('tab', { name: 'Photo' }).click();
  await appli.locator('.depot input[type=file]').setInputFiles(photo('stele.png'));
  await expect(appli.locator('.titre-ecran')).toHaveText('Fiche œuvre');
  await expect.poll(async () => (await lireTout<{ source: string }>(appli, 'images')).filter((i) => i.source === 'photo').length).toBe(1);
  // Modification : la fiche devient « personnalisée ».
  await appli.getByRole('button', { name: 'Modifier' }).click();
  await appli.getByLabel('Titre *').fill('Stèle de test modifiée');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(appli.locator('h2').first()).toHaveText('Stèle de test modifiée');
  // Suppression : fiche, image et fichier disparaissent.
  const fichiersAvant = await compter(appli, 'fichiers');
  await appli.getByRole('button', { name: 'Supprimer' }).click();
  await expect(appli.locator('.titre-ecran')).not.toHaveText('Fiche œuvre');
  expect(await compter(appli, 'oeuvres')).toBe(51);
  expect(await compter(appli, 'fichiers')).toBe(fichiersAvant - 1);
});

test('fiche préparée modifiée : pas écrasée par les mises à jour, restauration des fiches supprimées', async ({ appli }) => {
  const ref = REFERENCES[0];
  await menu(appli, 'Œuvres de référence');
  await appli.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill(ref.titre);
  await appli.locator('.carte-oeuvre').first().click();
  await appli.getByRole('button', { name: 'Modifier' }).click();
  await appli.getByLabel('Notes / points à retenir').fill('Mes propres notes');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(appli.locator('.titre-ecran')).toHaveText('Fiche œuvre');
  await appli.reload(); // relance : mise à jour des fiches préparées
  const o = (await lireTout<{ id: string; notes: string; personnalisee?: boolean }>(appli, 'oeuvres')).find((x) => x.id === ref.id)!;
  expect(o).toMatchObject({ notes: 'Mes propres notes', personnalisee: true });
  // Suppression puis restauration.
  await menu(appli, 'Œuvres de référence');
  await appli.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill(REFERENCES[1].titre);
  await appli.locator('.carte-oeuvre').first().click();
  await appli.getByRole('button', { name: 'Supprimer' }).click();
  await expect.poll(() => compter(appli, 'oeuvres')).toBe(50);
  await appli.reload();
  expect(await compter(appli, 'oeuvres')).toBe(50); // une fiche supprimée n'est pas réinstallée
  await appli.getByLabel('Ouvrir le menu').click();
  await appli.locator('.section-menu summary', { hasText: 'Réglages' }).click();
  await appli.getByRole('button', { name: 'Restaurer les fiches préparées supprimées' }).click();
  await expect(appli.getByText('1 fiche restaurée.')).toBeVisible();
  expect(await compter(appli, 'oeuvres')).toBe(51);
});

test('musées : recherche dans les collections ouvertes et notice jointe à la fiche', async ({ appli }) => {
  await menu(appli, 'Œuvres de référence');
  await appli.locator('.carte-oeuvre').first().click();
  await appli.getByText('Ajouter des œuvres réelles comparables').click();
  await appli.locator('.recherche-musees, form').filter({ has: appli.getByPlaceholder('Nataraja, Gandhara Buddha, Khmer Vishnu…') }).getByRole('button', { name: 'Chercher' }).click();
  await expect(appli.locator('.notice-resultat').first()).toBeVisible();
  const n = await appli.locator('.notice-resultat').count();
  expect(n).toBeGreaterThanOrEqual(3);
  await appli.locator('.notice-resultat').first().click();
  await appli.getByRole('button', { name: 'Joindre à la fiche' }).click();
  await expect.poll(async () => (await lireTout<{ notices?: unknown[] }>(appli, 'oeuvres')).filter((o) => o.notices?.length).length).toBe(1);
});

test('image depuis le net (Wikimedia Commons)', async ({ appli }) => {
  await menu(appli, 'Œuvres de référence');
  await appli.getByLabel('Nouvelle fiche').click();
  await appli.getByLabel('Titre *').fill('Fiche sans image');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await appli.getByRole('button', { name: /Ajouter une image|Trouver une image/ }).first().click();
  await appli.getByPlaceholder('Sarnath Buddha, Bayon, Naṭarāja…').fill('Bayon');
  await appli.getByPlaceholder('Sarnath Buddha, Bayon, Naṭarāja…').press('Enter');
  await appli.locator('.resultat').first().click();
  await expect.poll(async () => (await lireTout<{ source: string }>(appli, 'images')).filter((i) => i.source === 'commons').length).toBe(51);
});
