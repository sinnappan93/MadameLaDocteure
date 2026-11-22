/**
 * Version web installable et hors ligne : service worker, manifeste, relance sans réseau, mise à jour sur demande.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { attendreInstallation, expect, MAINTENANT, menu, simulerReseau, test } from './outils';

test.use({ serviceWorkers: 'allow' });
// Le test de mise à jour modifie le service worker servi : les tests de ce fichier passent l'un après l'autre.
test.describe.configure({ mode: 'serial' });

async function ouvrirAvecServiceWorker(page: import('@playwright/test').Page) {
  await simulerReseau(page.context(), { appelsIA: [], erreurIA: 0 });
  await page.clock.install({ time: MAINTENANT });
  await page.goto('/');
  await attendreInstallation(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect(page.getByText('L’appli fonctionne maintenant hors ligne.')).toBeVisible();
  // La page suivante est servie par le service worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('manifeste et icônes : l’appli est installable', async ({ page }) => {
  await ouvrirAvecServiceWorker(page);
  const manifeste = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]')!.getAttribute('href')!;
    return (await fetch(href)).json();
  });
  expect(manifeste).toMatchObject({ name: 'MadameLaDocteure', display: 'standalone', start_url: './', scope: './', lang: 'fr' });
  const tailles = manifeste.icons.map((i: { sizes: string }) => i.sizes);
  expect(tailles).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifeste.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of manifeste.icons) expect((await page.request.get(i.src)).status()).toBe(200);
  await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute('href', './apple-touch-icon.png');
});

test('sans réseau, l’appli se relance et tout fonctionne (sauf l’IA et les musées)', async ({ page, context }) => {
  await ouvrirAvecServiceWorker(page);
  // Visite de la carte en ligne : les fonds consultés sont gardés.
  await menu(page, 'Carte des sites');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('.pastille-hors-ligne')).toHaveText('Hors ligne');
  // Fiches et images (stockées sur l'appareil).
  await menu(page, 'Œuvres de référence');
  await page.locator('.carte-oeuvre').first().click();
  await expect(page.locator('main img').first()).toBeVisible();
  expect(await page.locator('main img').first().evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  // Révision, plan, sujet blanc, projection.
  await menu(page, 'Identifier les œuvres');
  await page.getByRole('button', { name: /^Commencer/ }).click();
  await expect(page.locator('.progression-seance')).toBeVisible();
  await menu(page, 'Plan de révision');
  await page.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(page.locator('.jour-plan').first()).toBeVisible();
  await menu(page, 'Sujets blancs');
  await page.getByRole('button', { name: /Commencer/ }).click();
  await expect(page.locator('.chrono-valeur')).toBeVisible();
  // La carte des sites retrouve ses fonds hors ligne.
  await menu(page, 'Carte des sites');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  // Retour du réseau : la pastille disparaît.
  await context.setOffline(false);
  await expect(page.locator('.pastille-hors-ligne')).toHaveCount(0);
});

test('nouvelle version : proposée, jamais imposée (pas de rechargement en pleine épreuve)', async ({ page }) => {
  await ouvrirAvecServiceWorker(page);
  await menu(page, 'Sujets blancs');
  await page.getByRole('button', { name: /Commencer/ }).click();
  await page.locator('.copie-texte').fill('Copie en cours pendant la mise à jour.');
  // Une nouvelle version est publiée : on modifie le service worker servi par le serveur de test.
  const sw = fileURLToPath(new URL('../dist/sw.js', import.meta.url));
  const original = readFileSync(sw, 'utf8');
  try {
    writeFileSync(sw, `${original}\n// nouvelle version ${Date.now()}`);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  } finally {
    writeFileSync(sw, original);
  }
  await expect(page.getByText('Une nouvelle version de l’appli est prête.')).toBeVisible();
  // Rien ne bouge tant qu'on n'a pas choisi : la copie est toujours là.
  await expect(page.locator('.copie-texte')).toHaveValue('Copie en cours pendant la mise à jour.');
  await page.getByRole('button', { name: 'Plus tard' }).click();
  await expect(page.getByText('Une nouvelle version de l’appli est prête.')).toHaveCount(0);
  await expect(page.locator('.copie-texte')).toHaveValue('Copie en cours pendant la mise à jour.');
});

test('nouvelle version : « Mettre à jour » l’installe et recharge l’appli', async ({ page }) => {
  await ouvrirAvecServiceWorker(page);
  const sw = fileURLToPath(new URL('../dist/sw.js', import.meta.url));
  const original = readFileSync(sw, 'utf8');
  try {
    writeFileSync(sw, `${original}\n// nouvelle version ${Date.now()}`);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
    await page.getByRole('button', { name: 'Mettre à jour' }).click();
    await page.waitForEvent('load');
  } finally {
    writeFileSync(sw, original);
  }
  await expect(page.locator('.hero')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting)).toBe(false);
  await expect(page.getByText('Une nouvelle version de l’appli est prête.')).toHaveCount(0);
});
