import { activerIA, AUJOURDHUI, expect, menu, test } from './outils';

/** Toutes les entrées du menu, avec le titre attendu et un élément caractéristique de l'écran. */
const ECRANS: Array<[string, string, string]> = [
  ['Plan de révision', 'Plan de révision', 'text=Générer mon plan'],
  ['Projection', 'Projection', '.tuiles-pret'],
  ['Bibliographie', 'Bibliographie', 'text=Suggestions de lecture'],
  ['Journal de visites', 'Journal de visites', 'text=Nouvelle visite aujourd’hui'],
  ['Identifier les œuvres', 'Révision', '[role=tab][aria-selected=true]:has-text("Œuvres")'],
  ['Comparer deux œuvres', 'Révision', '[role=tab][aria-selected=true]:has-text("Comparer")'],
  ['Glossaire en cartes', 'Révision', '[role=tab][aria-selected=true]:has-text("Glossaire")'],
  ['Quiz libre', 'Révision', 'text=Lancer le quiz'],
  ['Quiz de repères', 'Révision', 'text=Lancer le quiz'],
  ['Sujets blancs', 'Sujet blanc', '.carte-sujet'],
  ['Plan en 15 minutes', 'Plan en 15 minutes', '.carte-sujet'],
  ['Mes copies et corrections', 'Mes copies', 'text=Aucune copie pour l’instant'],
  ['Banque de sujets', 'Banque de sujets', 'text=Générer des sujets avec l’IA'],
  ['Simulateur d’oral', 'Simulateur d’oral', 'text=Tirer le dossier et préparer'],
  ['Vocabulaire anglais', 'Révision', '[role=tab][aria-selected=true]:has-text("Anglais")'],
  ['Œuvres de référence', 'Œuvres de référence', '.carte-oeuvre'],
  ['Comparaisons', 'Comparaisons', 'text=S’entraîner à comparer'],
  ['Glossaire', 'Glossaire', 'text=Réviser le glossaire'],
  ['Frise chronologique', 'Frise chronologique', '[aria-label="Zoomer"]'],
  ['Carte des sites', 'Carte des sites', '.leaflet-container'],
  ['Comment m’utiliser ?', 'Comment m’utiliser ?', '.rubrique'],
];

test('accueil : compte à rebours, invitation au plan, projection, aires', async ({ appli }) => {
  await expect(appli.locator('.compte-a-rebours')).toHaveText(/J-220 avant les écrits/);
  await expect(appli.locator('.plan-invitation')).toBeVisible();
  await expect(appli.locator('.apercu-projection .tuile-pret')).toHaveCount(2);
  await expect(appli.locator('.tuile')).toHaveCount(10);
  // Les 51 fiches préparées sont réparties dans les aires.
  const comptes = await appli.locator('.tuile-compte').allInnerTexts();
  const total = comptes.reduce((t, c) => t + (Number(c.match(/\d+/)?.[0]) || 0), 0);
  expect(total).toBe(51);
});

for (const [entree, titre, element] of ECRANS)
  test(`menu › ${entree}`, async ({ appli }) => {
    await menu(appli, entree);
    await expect(appli.locator('.titre-ecran')).toHaveText(titre);
    await expect(appli.locator(element).first()).toBeVisible();
    // L'entrée courante est mise en évidence dans le menu.
    await appli.getByLabel('Ouvrir le menu').click();
    await expect(appli.locator('.entree-menu.courante .entree-nom')).toHaveText(entree);
    await appli.getByLabel('Fermer le menu').click();
    // Retour à l'accueil.
    await appli.getByLabel('Retour').click();
    await expect(appli.locator('.hero')).toBeVisible();
  });

test('menu : sections et entrées dans l’ordre attendu', async ({ appli }) => {
  await appli.getByLabel('Ouvrir le menu').click();
  await expect(appli.locator('.section-menu > summary')).toHaveText([/Préparation/, /Exercices/, /Mode examen/, /Ressources/, /Aide/, /Réglages/, /Bientôt/]);
  await expect(appli.locator('.section-menu[open] .entree-nom')).toHaveCount(ECRANS.length - 1);
});

test('réglages : prénom, thème sombre et date des écrits gardés après rechargement', async ({ appli }) => {
  await appli.getByLabel('Ouvrir le menu').click();
  await appli.locator('.section-menu summary', { hasText: 'Réglages' }).click();
  await appli.getByLabel('Prénom').fill('Alaini');
  await appli.getByRole('radio', { name: 'Sombre' }).click();
  await appli.getByLabel('Date des écrits (estimation)').fill('2027-06-15');
  await appli.getByLabel('Fermer le menu').click();
  await appli.reload();
  await expect(appli.locator('.hero h1')).toHaveText('Bonjour Alaini');
  await expect(appli.locator('html')).toHaveAttribute('data-theme', 'sombre');
  await expect(appli.locator('.compte-a-rebours')).toHaveText(/J-204/);
  const fond = await appli.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fond).not.toBe('rgb(246, 242, 234)');
});

test('réglages : IA activée avec clé et accord, désactivée sans accord', async ({ appli }) => {
  await activerIA(appli);
  await appli.getByLabel('Ouvrir le menu').click();
  await appli.locator('.section-menu summary', { hasText: 'Réglages' }).click();
  await appli.locator('.reglages-ia .case input').uncheck();
  await expect(appli.locator('.etat-ia')).toHaveText(/IA désactivée/);
});

test('aide : toutes les rubriques s’ouvrent', async ({ appli }) => {
  await menu(appli, 'Comment m’utiliser ?');
  const rubriques = appli.locator('.rubrique');
  const n = await rubriques.count();
  expect(n).toBeGreaterThanOrEqual(15);
  for (let i = 0; i < n; i++) {
    if ((await rubriques.nth(i).getAttribute('open')) === null) await rubriques.nth(i).locator('summary').click();
    await expect(rubriques.nth(i).locator('.rubrique-contenu')).toBeVisible();
  }
  await expect(appli.getByText('Plan de révision et calendrier')).toBeVisible();
  await expect(appli.getByText('Simulateur d’oral').first()).toBeVisible();
});

test('date du jour des tests', async ({ appli }) => {
  expect(await appli.evaluate(() => new Date().toISOString().slice(0, 10))).toBe(AUJOURDHUI);
});
