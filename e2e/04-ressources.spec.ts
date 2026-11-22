import { PERIODES } from '../src/domain/catalogue';
import { REFERENCES } from '../src/data/references';
import { expect, menu, test } from './outils';

test('frise : 33 périodes, une ligne par aire, points des fiches, zoom et détail', async ({ appli }) => {
  await menu(appli, 'Frise chronologique');
  await expect(appli.locator('.frise-ligne')).toHaveCount(10);
  await expect(appli.locator('.frise-periode')).toHaveCount(PERIODES.length);
  const points = await appli.locator('.frise-oeuvre').count();
  expect(points).toBe(REFERENCES.filter((r) => r.debut !== undefined).length);
  // Non-régression : à chaque niveau de zoom, les points d'une même ligne ne se chevauchent pas.
  const chevauchements = async () => {
    const boites = await appli.locator('.frise-oeuvre').evaluateAll((els) => els.map((e) => ({ ...e.getBoundingClientRect().toJSON(), ligne: e.closest('.frise-ligne')?.getAttribute('aria-label'), titre: e.getAttribute('aria-label') })));
    return boites.flatMap((a, i) =>
      boites
        .slice(i + 1)
        .filter((b) => a.ligne === b.ligne && !(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1))
        .map((b) => `${a.titre} / ${b.titre}`),
    );
  };
  const zoomer = appli.getByLabel('Zoomer', { exact: true });
  const dezoomer = appli.getByLabel('Dézoomer', { exact: true });
  while (await dezoomer.isEnabled()) await dezoomer.click();
  const largeurs: number[] = [];
  for (;;) {
    expect(await chevauchements()).toEqual([]);
    largeurs.push(await appli.locator('.frise-contenu').evaluate((e) => e.getBoundingClientRect().width));
    if (!(await zoomer.isEnabled())) break;
    await zoomer.click();
  }
  expect(largeurs).toHaveLength(7);
  expect([...largeurs].sort((a, b) => a - b)).toEqual(largeurs);
  await appli.getByRole('button', { name: 'Médiéval' }).click();
  // Détail d'une période, puis d'une œuvre.
  await appli.locator('.frise-periode').first().click({ force: true });
  await expect(appli.locator('.frise-periode.choisie')).toHaveCount(1);
  await appli.locator('.frise-oeuvre').first().click({ force: true });
  await expect(appli.locator('.frise-oeuvre.choisie')).toHaveCount(1);
});

test('carte des sites : points des fiches, filtre par aire, ouverture d’une fiche', async ({ appli }) => {
  await menu(appli, 'Carte des sites');
  await expect(appli.locator('.leaflet-tile-loaded').first()).toBeVisible();
  // Fond de carte Esri (CARTO exige une clé : non-régression).
  const tuiles = await appli.locator('.leaflet-tile').evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
  expect(tuiles.every((t) => t.includes('arcgisonline.com'))).toBe(true);
  const sites = new Set(REFERENCES.filter((r) => r.lat !== undefined).map((r) => `${r.lat},${r.lng}`)).size;
  await expect(appli.locator('path.leaflet-interactive')).toHaveCount(sites);
  await appli.getByLabel('Aire culturelle').selectOption('cambodge');
  const cambodge = new Set(REFERENCES.filter((r) => r.lat !== undefined && r.aireId === 'cambodge').map((r) => `${r.lat},${r.lng}`)).size;
  await expect(appli.locator('path.leaflet-interactive')).toHaveCount(cambodge);
  await appli.locator('path.leaflet-interactive').first().click({ force: true });
  await appli.locator('.bulle-fiche').first().click();
  await expect(appli.locator('.titre-ecran')).toHaveText('Fiche œuvre');
});

test('glossaire : recherche et catégories', async ({ appli }) => {
  await menu(appli, 'Glossaire');
  const total = await appli.locator('dt').count();
  expect(total).toBe(110);
  await appli.getByPlaceholder('Chercher un terme : mudrā, vimāna, Garuḍa…').fill('garuda');
  await expect(appli.locator('dt').first()).toContainText('Garuḍa');
  await appli.getByPlaceholder('Chercher un terme : mudrā, vimāna, Garuḍa…').fill('zzzz');
  await expect(appli.getByText('Aucun terme ne correspond.')).toBeVisible();
});

test('comparaisons : paires et critères', async ({ appli }) => {
  await menu(appli, 'Comparaisons');
  await expect(appli.getByText('Ajanta ou Sigiriya ?').first()).toBeVisible();
});
