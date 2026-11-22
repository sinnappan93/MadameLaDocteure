import type { Seance } from '../src/domain/plan';
import { compter, expect, jouerSeance, lireTout, menu, photo, test } from './outils';

async function creerPlan(page: import('@playwright/test').Page) {
  await page.locator('.plan-invitation').click();
  await page.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(page.locator('.jour-plan').first()).toBeVisible();
}

test('plan : génération, semaine, mois, accueil', async ({ appli }) => {
  await creerPlan(appli);
  await expect(appli.locator('.carte-sujet')).toContainText('Travail de fond');
  await expect(appli.locator('.carte-sujet')).toContainText('J-220 avant les écrits');
  const seances = await lireTout<Seance>(appli, 'seances');
  expect(seances.length).toBeGreaterThan(400);
  expect(seances.filter((s) => s.type === 'jalon').map((s) => s.titre)).toEqual(['Écrits', 'Résultats d’admissibilité', 'Oraux']);
  // Semaine courante : 6 jours travaillés, dimanche libre.
  await expect(appli.locator('.jour-plan')).toHaveCount(7);
  await expect(appli.locator('.jour-plan').last().getByText('Libre')).toBeVisible();
  await expect(appli.locator('.jour-plan.aujourdhui .seance').first()).toContainText('Identifier');
  await expect(appli.locator('.jour-plan', { hasText: 'samedi 28 novembre' }).locator('.seance-titre')).toHaveText('Sujet blanc : dissertation de spécialité');
  await appli.getByRole('button', { name: 'Semaine suivante' }).click();
  await expect(appli.locator('.jour-plan', { hasText: 'samedi 5 décembre' }).locator('.seance-titre')).toContainText('Visite au Guimet');
  // Vue mois et accueil.
  await appli.getByRole('tab', { name: 'Mois' }).click();
  await expect(appli.locator('.case-jour')).toHaveCount(42);
  await appli.getByLabel('Retour').click();
  await expect(appli.locator('.bloc-aujourdhui .mois-nom')).toHaveText('novembre 2026');
  await expect(appli.locator('.bloc-aujourdhui .jour-plan h3')).toHaveText('Aujourd’hui');
  await appli.getByRole('gridcell', { name: /^samedi 28 novembre/ }).click();
  await expect(appli.locator('.bloc-aujourdhui .seance-titre')).toHaveText('Sujet blanc : dissertation de spécialité');
});

test('non-régression : lignes du calendrier du mois de même hauteur', async ({ appli }) => {
  await creerPlan(appli);
  await appli.getByLabel('Retour').click();
  await expect(appli.locator('.bloc-aujourdhui .case-jour')).toHaveCount(42);
  // Mesure une fois le rendu stabilisé (polices, points des séances).
  await expect
    .poll(() => appli.locator('.bloc-aujourdhui .case-jour').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().height)))]))
    .toHaveLength(1);
});

test('plan : « Commencer » ouvre le bon exercice, cases cochées à la main ou par l’appli', async ({ appli }) => {
  await creerPlan(appli);
  const identifier = appli.locator('.jour-plan.aujourdhui .seance').first();
  const aire = (await identifier.locator('.seance-titre').innerText()).replace('Identifier : ', '');
  await identifier.getByRole('button', { name: 'Commencer' }).click();
  await expect(appli.locator('select').first()).toHaveValue(/.+/);
  expect(await appli.locator('select').first().evaluate((s: HTMLSelectElement) => s.options[s.selectedIndex].text)).toBe(aire);
  await appli.getByRole('button', { name: /^Commencer/ }).click();
  await jouerSeance(appli, 2);
  await menu(appli, 'Plan de révision');
  await expect(appli.locator('.jour-plan.aujourdhui .seance').first()).toHaveClass(/faite/);
  await expect(appli.locator('.jour-plan.aujourdhui .seance').first()).toContainText('vue par l’appli');
  // Case cochée à la main, gardée après rechargement.
  await appli.locator('.jour-plan.aujourdhui .seance').nth(1).locator('input[type=checkbox]').click();
  await expect(appli.locator('.jour-plan.aujourdhui .seance').nth(1).locator('input[type=checkbox]')).toBeChecked();
  await appli.reload();
  await menu(appli, 'Plan de révision');
  await expect(appli.locator('.jour-plan.aujourdhui .seance').nth(1).locator('input[type=checkbox]')).toBeChecked();
  await expect(appli.locator('.bilan-semaine')).toContainText('2 /');
  // Sujet blanc du samedi : l'épreuve est présélectionnée.
  await appli.locator('.jour-plan', { hasText: 'samedi 28 novembre' }).getByRole('button', { name: 'Commencer' }).click();
  await expect(appli.getByRole('radio', { name: 'Spécialité' })).toHaveAttribute('aria-checked', 'true');
});

test('plan : réglages, démarches, dates incohérentes, recalcul qui garde ce qui est fait', async ({ appli }) => {
  await appli.locator('.plan-invitation').click();
  await appli.getByLabel('Oraux').fill('2027-06-01');
  await expect(appli.getByText('Les dates doivent se suivre : début, écrits, admissibilité, oraux.')).toBeVisible();
  await expect(appli.getByRole('button', { name: 'Générer mon plan' })).toBeDisabled();
  await appli.getByLabel('Oraux').fill('2027-09-23');
  await appli.getByRole('textbox', { name: 'Démarche', exact: true }).fill('Clôture des inscriptions');
  await appli.getByLabel('Date de la démarche').fill('2027-01-15');
  await appli.getByRole('button', { name: 'Ajouter' }).click();
  await appli.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(appli.locator('.carte-sujet')).toContainText('Prochain jalon : Clôture des inscriptions');
  await appli.locator('.jour-plan.aujourdhui input[type=checkbox]').first().click();
  await expect(appli.locator('.jour-plan.aujourdhui input[type=checkbox]').first()).toBeChecked();
  const faite = (await lireTout<Seance>(appli, 'seances')).find((s) => s.faite)!;
  // Sans le samedi : plus de sujet blanc ni de visite.
  await appli.getByRole('button', { name: 'Réglages du plan' }).click();
  await appli.getByRole('group', { name: 'Jours de travail' }).getByRole('button', { name: 'samedi' }).click();
  await appli.getByRole('button', { name: 'Mettre à jour le plan' }).click();
  await expect(appli.getByRole('button', { name: 'Recalculer avec mes lacunes' })).toBeVisible();
  const apres = await lireTout<Seance>(appli, 'seances');
  expect(apres.find((s) => s.id === faite.id)?.faite).toBe(true);
  expect(apres.filter((s) => s.date > '2026-11-23').some((s) => s.type === 'sujet-blanc' || s.type === 'visite')).toBe(false);
  expect(apres.filter((s) => s.date > '2026-11-23').every((s) => s.type === 'jalon' || new Date(`${s.date}T12:00`).getDay() !== 6)).toBe(true);
});

test('bibliographie : suggestion, pages lues, notes, œuvres citées, lien sur la fiche, plan', async ({ appli }) => {
  await menu(appli, 'Bibliographie');
  await appli.locator('.suggestion', { hasText: 'Huntington' }).getByRole('button', { name: '+ Ajouter' }).click();
  await appli.locator('.lecture-ligne').first().click();
  await appli.getByRole('button', { name: 'Modifier' }).click();
  await appli.getByLabel('Nombre de pages').fill('100');
  await appli.getByRole('button', { name: 'Enregistrer' }).click();
  await appli.getByLabel('J’ai lu jusqu’à la page').fill('42');
  await appli.getByRole('button', { name: 'Noter' }).click();
  await expect(appli.locator('.progression-libelle')).toHaveText('Page 42 sur 100 · 42 %');
  await expect(appli.getByRole('radio', { name: 'En cours' })).toHaveAttribute('aria-checked', 'true');
  await appli.getByLabel('Notes de lecture').fill('Chap. 8 : Mathurā.');
  await appli.getByLabel('Chercher une fiche à relier').fill('sarnath');
  await appli.locator('.resultat-fiche').first().click();
  await expect(appli.locator('.oeuvre-liee')).toHaveCount(1);
  // Le plan reprend la lecture en cours à la bonne page.
  await menu(appli, 'Plan de révision');
  await appli.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(appli.locator('.jour-plan').first()).toBeVisible();
  const lecture = (await lireTout<Seance>(appli, 'seances')).find((s) => s.type === 'lecture' && s.lectureId);
  expect(lecture?.description).toContain('reprends p. 43');
  // Lien depuis la fiche.
  await menu(appli, 'Bibliographie');
  await appli.locator('.lecture-ligne').first().click();
  await expect(appli.getByLabel('Notes de lecture')).toHaveValue('Chap. 8 : Mathurā.');
  await appli.locator('.oeuvre-liee-bouton').click();
  await expect(appli.locator('.liens-preparation')).toContainText('Citée dans : Huntington 1985');
  // Lecture terminée.
  await appli.locator('.liens-preparation button').click();
  await appli.getByLabel('J’ai lu jusqu’à la page').fill('150');
  await appli.getByRole('button', { name: 'Noter' }).click();
  await expect(appli.getByRole('radio', { name: 'Lu' })).toHaveAttribute('aria-checked', 'true');
  await expect(appli.locator('.progression-libelle')).toHaveText('Page 100 sur 100 · 100 %');
});

test('visite : salles, photo transformée en fiche (avec le cartel), œuvres à revoir', async ({ appli }) => {
  await menu(appli, 'Journal de visites');
  await appli.getByRole('button', { name: /Nouvelle visite aujourd’hui/ }).click();
  await appli.getByRole('button', { name: 'Cambodge (art khmer)' }).click();
  await appli.locator('.visites > .bloc .depot-photo input').setInputFiles(photo('linteau.png'));
  await appli.locator('.photo-fiche .depot-photo input').setInputFiles(photo('cartel.png'));
  await expect(appli.locator('.apercus-photo img')).toHaveCount(2);
  await expect(appli.locator('.photo-fiche select')).toHaveValue('cambodge');
  await appli.getByLabel('Titre (d’après le cartel)').fill('Linteau (visite de test)');
  await appli.getByLabel('Datation').fill('Xe s.');
  await appli.getByLabel('N° d’inventaire').fill('MG 0000');
  await appli.getByRole('button', { name: 'Créer la fiche' }).click();
  await expect(appli.locator('.visites .bloc').filter({ hasText: 'Œuvres photographiées (1)' })).toBeVisible();
  const o = (await lireTout<{ titre: string; conservation: string; etiquettes: string[]; id: string }>(appli, 'oeuvres')).find((x) => x.titre === 'Linteau (visite de test)')!;
  expect(o.conservation).toBe('Musée Guimet (MNAAG), Paris (MG 0000)');
  expect((await lireTout<{ oeuvreId: string }>(appli, 'images')).filter((i) => i.oeuvreId === o.id)).toHaveLength(2);
  await expect(appli.getByText(/À revoir sur place : tes fiches du Guimet dans ces salles \(\d+\)/)).toBeVisible();
  // La fiche est reliée à la visite ; supprimer la visite garde la fiche.
  await appli.locator('.oeuvre-liee-bouton', { hasText: 'Linteau (visite de test)' }).click();
  await expect(appli.locator('.liens-preparation')).toContainText('Photographiée lors de la visite du 23 novembre 2026');
  await appli.locator('.liens-preparation button').click();
  await appli.getByRole('button', { name: 'Supprimer la visite' }).click();
  await expect.poll(() => compter(appli, 'visites')).toBe(0);
  expect(await compter(appli, 'oeuvres')).toBe(52);
});
