/**
 * Non-régression : mise à jour d'une base créée par une ancienne version publiée (aucune donnée perdue),
 * et vérifications transverses sur les bugs déjà corrigés.
 */
import { readFileSync } from 'node:fs';
import { REFERENCES } from '../src/data/references';
import { attendreInstallation, compter, expect, lireTout, MAINTENANT, menu, simulerReseau, test } from './outils';

interface BaseExportee {
  version: number;
  stores: Array<{ nom: string; keyPath: string; autoIncrement: boolean; index: Array<{ nom: string; keyPath: string; unique: boolean; multiEntry: boolean }> }>;
  donnees: Record<string, Array<Record<string, unknown>>>;
}

/** Recrée telle quelle une base exportée d'une ancienne version (schéma et contenu), avant d'ouvrir l'appli. */
async function restaurer(page: import('@playwright/test').Page, fichier: string) {
  const base = JSON.parse(readFileSync(new URL(`./fixtures/${fichier}`, import.meta.url), 'utf8')) as BaseExportee;
  await page.goto('/icon.svg'); // même origine que l'appli, sans la lancer
  await page.evaluate(async (b: BaseExportee) => {
    const lignes = Object.fromEntries(
      await Promise.all(
        Object.entries(b.donnees).map(async ([t, ls]: [string, Array<Record<string, unknown>>]) => [
          t,
          await Promise.all(ls.map(async (l) => (l.blob && typeof l.blob === 'object' && '__blob' in l.blob ? { ...l, blob: await (await fetch((l.blob as { __blob: string }).__blob)).blob() } : l))),
        ]),
      ),
    );
    await new Promise<void>((ok, ko) => {
      const r = indexedDB.open('madameladocteure', b.version);
      r.onupgradeneeded = () => {
        for (const s of b.stores) {
          const os = r.result.createObjectStore(s.nom, { keyPath: s.keyPath, autoIncrement: s.autoIncrement });
          for (const i of s.index) os.createIndex(i.nom, i.keyPath, { unique: i.unique, multiEntry: i.multiEntry });
        }
      };
      r.onsuccess = () => {
        const tx = r.result.transaction(Object.keys(lignes), 'readwrite');
        for (const [t, ls] of Object.entries(lignes) as Array<[string, unknown[]]>) for (const l of ls) tx.objectStore(t).put(l);
        tx.oncomplete = () => {
          r.result.close();
          ok();
        };
      };
      r.onerror = () => ko(r.error);
    });
  }, base);
  return base;
}

async function ouvrirAppli(page: import('@playwright/test').Page) {
  await simulerReseau(page, { appelsIA: [], erreurIA: 0 });
  await page.clock.install({ time: MAINTENANT });
  await page.goto('/');
  await attendreInstallation(page);
}

for (const [fichier, avecOral] of [
  ['base-v4.json', false],
  ['base-v5.json', true],
] as const)
  test(`mise à jour d’une base ${fichier.replace('.json', '').replace('base-', '')} : aucune donnée perdue`, async ({ page, erreurs }) => {
    const ancienne = await restaurer(page, fichier);
    await ouvrirAppli(page);
    const version = await page.evaluate(() => new Promise<number>((ok) => {
      const r = indexedDB.open('madameladocteure');
      r.onsuccess = () => { ok(r.result.version); r.result.close(); };
    }));
    expect(version).toBe(60);
    // Fiches : la fiche créée et sa photo, la fiche préparée modifiée, la fiche supprimée (pas réinstallée).
    const oeuvres = await lireTout<{ id: string; titre: string; notes: string; personnalisee?: boolean; imagePrincipaleId?: string }>(page, 'oeuvres');
    expect(oeuvres).toHaveLength(ancienne.donnees.oeuvres.length);
    const perso = oeuvres.find((o) => o.titre === 'Fiche ancienne avec photo')!;
    expect(perso.imagePrincipaleId).toBeTruthy();
    expect(oeuvres.find((o) => o.id === 'ref-pretre-roi')).toMatchObject({ notes: 'Notes personnelles (ancienne version)', personnalisee: true });
    expect(REFERENCES.filter((r) => !oeuvres.some((o) => o.id === r.id))).toHaveLength(1);
    await menu(page, 'Œuvres de référence');
    await page.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill('Fiche ancienne');
    await page.locator('.carte-oeuvre').first().click();
    await expect(page.locator('.fiche img, img').first()).toHaveJSProperty('complete', true);
    expect(await page.locator('img').first().evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
    // Révisions, copie, banque de sujets.
    expect(await compter(page, 'revisions')).toBe(ancienne.donnees.revisions.length);
    await menu(page, 'Mes copies et corrections');
    await expect(page.locator('.etat-copie')).toHaveText(['Rendue · pas encore corrigée']);
    await page.locator('.copie-ligne').click();
    await expect(page.locator('.texte-copie')).toHaveText('Copie écrite avec l’ancienne version.');
    await menu(page, 'Banque de sujets');
    await expect(page.locator('.sujet', { hasText: 'Sujet de jury (ancienne version)' })).toBeVisible();
    if (avecOral) {
      await menu(page, 'Simulateur d’oral');
      await expect(page.locator('.copie-ligne')).toHaveCount(1);
      await page.locator('.copie-ligne').click();
      await expect(page.getByRole('button', { name: 'Passer aux questions du jury' })).toBeVisible();
      await expect(page.locator('#resume-expose')).toBeVisible();
    }
    // Les nouvelles fonctions marchent sur la base mise à jour.
    await menu(page, 'Plan de révision');
    await page.getByRole('button', { name: 'Générer mon plan' }).click();
    await expect(page.locator('.jour-plan').first()).toBeVisible();
    await menu(page, 'Projection');
    await expect(page.locator('.tuile-pret')).toHaveCount(2);
    expect(erreurs).toEqual([]);
  });

test('textes : pas d’espace après une apostrophe, pas de double espace (menu et aide)', async ({ appli }) => {
  await appli.getByLabel('Ouvrir le menu').click();
  await appli.locator('.tiroir details').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
  const menuTexte = await appli.locator('.tiroir').innerText();
  await appli.getByLabel('Fermer le menu').click();
  await menu(appli, 'Comment m’utiliser ?');
  await appli.locator('.rubrique').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
  const aide = await appli.locator('main').innerText();
  for (const texte of [menuTexte, aide]) {
    expect(texte).not.toMatch(/[’'] [a-zàâéèêîôûœ]/);
    expect(texte).not.toMatch(/[^\s] {2,}[^\s]/);
  }
});

test('sans réseau (une fois l’appli ouverte) : fiches, révisions, examen et plan fonctionnent', async ({ appli }) => {
  await appli.context().setOffline(true);
  await menu(appli, 'Identifier les œuvres');
  await appli.getByRole('button', { name: /^Commencer/ }).click();
  await expect(appli.locator('.progression-seance')).toBeVisible();
  await expect(appli.locator('main img').first()).toBeVisible();
  await menu(appli, 'Sujets blancs');
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.locator('.copie-texte').fill('Copie hors ligne.');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await menu(appli, 'Plan de révision');
  await appli.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(appli.locator('.jour-plan').first()).toBeVisible();
  await menu(appli, 'Projection');
  await expect(appli.locator('.tuile-pret')).toHaveCount(2);
  await appli.context().setOffline(false);
});
