import { expect, jouerSeance, lireTout, menu, test } from './outils';

type Etat = { id: string; oeuvreId: string; type: string; intervalle: number; echeance: string };

test('identifier les œuvres : séance, puis cartes de second niveau le lendemain', async ({ appli }) => {
  await menu(appli, 'Identifier les œuvres');
  await appli.getByRole('button', { name: /^Commencer · \d+ cartes?$/ }).click();
  // « Facile » : les œuvres ne sont pas dues le lendemain, place aux variantes (une carte par œuvre et par séance).
  const j1 = await jouerSeance(appli, 3);
  expect(j1.cartes).toBe(10); // 10 nouvelles œuvres par séance
  expect(new Set(j1.consignes)).toEqual(new Set(['Identifie cette œuvre : titre, datation, lieu, style.']));
  const etats = await lireTout<Etat>(appli, 'revisions');
  expect(etats.filter((e) => e.type === 'identifier')).toHaveLength(10);
  // Lendemain : les variantes (période, site, musée, iconographie) arrivent, au plus 5 par séance.
  await appli.clock.setSystemTime(new Date('2026-11-24T09:00:00+01:00'));
  await appli.reload();
  await menu(appli, 'Identifier les œuvres');
  // 10 nouvelles œuvres + 5 cartes de second niveau au plus.
  await appli.getByRole('button', { name: 'Commencer · 15 cartes' }).click();
  const j2 = await jouerSeance(appli, 2);
  const variantes = j2.consignes.filter((c) => !c.startsWith('Identifie'));
  expect(variantes.length).toBeGreaterThanOrEqual(5); // (une variante ratée revient dans la séance)
  await expect(appli.locator('.fin-titre')).toHaveText('Séance terminée');
});

test('« À revoir » : la carte revient dans la journée', async ({ appli }) => {
  await menu(appli, 'Identifier les œuvres');
  await appli.getByRole('button', { name: /^Commencer/ }).click();
  await appli.getByRole('button', { name: 'Voir la réponse' }).click();
  await appli.locator('.note-0').click();
  const e = (await lireTout<Etat>(appli, 'revisions'))[0];
  expect(e.intervalle).toBe(0);
  const dans = (new Date(e.echeance).getTime() - Date.parse('2026-11-23T09:00:00+01:00')) / 60000;
  expect(Math.round(dans)).toBe(10);
});

test('révision par aire', async ({ appli }) => {
  await menu(appli, 'Identifier les œuvres');
  await appli.locator('select').first().selectOption('cambodge');
  await appli.getByRole('button', { name: /^Commencer/ }).click();
  await jouerSeance(appli, 3);
  const ids = (await lireTout<Etat>(appli, 'revisions')).map((e) => e.oeuvreId);
  const oeuvres = await lireTout<{ id: string; aireId: string }>(appli, 'oeuvres');
  expect(ids.length).toBeGreaterThan(0);
  expect(ids.every((id) => oeuvres.find((o) => o.id === id)?.aireId === 'cambodge')).toBe(true);
});

for (const [entree, prefixe] of [
  ['Glossaire en cartes', 'gl-'],
  ['Comparer deux œuvres', 'cmp-'],
  ['Vocabulaire anglais', 'en-'],
] as const)
  test(`${entree} : séance complète enregistrée`, async ({ appli }) => {
    await menu(appli, entree);
    await appli.getByRole('button', { name: /^Commencer/ }).click();
    const j = await jouerSeance(appli, 2);
    expect(j.cartes).toBeGreaterThan(0);
    const etats = await lireTout<Etat>(appli, 'revisions');
    expect(etats.length).toBe(j.cartes);
    expect(etats.every((e) => e.oeuvreId.startsWith(prefixe))).toBe(true);
  });

test('quiz libre (mélange) : 10 questions, score et erreurs à refaire', async ({ appli }) => {
  await menu(appli, 'Quiz libre');
  await appli.getByRole('button', { name: /Lancer le quiz/ }).click();
  const j = await jouerSeance(appli);
  expect(j.cartes).toBe(10);
  await expect(appli.locator('.fin-titre')).toHaveText('Quiz terminé');
  // Le quiz libre n'écrit rien dans le calendrier de répétition espacée.
  expect(await lireTout(appli, 'revisions')).toHaveLength(0);
});

test('quiz de repères : dynasties et carte', async ({ appli }) => {
  await menu(appli, 'Quiz de repères');
  await appli.getByRole('button', { name: /Lancer le quiz/ }).click();
  const j = await jouerSeance(appli);
  expect(j.cartes).toBeGreaterThan(0);
  expect(j.consignes.some((c) => c.startsWith('Place sur la carte'))).toBe(true);
  expect(j.consignes.some((c) => /dynastie|régnait|siècle/i.test(c))).toBe(true);
});

test('non-régression : « Réviser » depuis Comparaisons et Glossaire ouvre le bon onglet', async ({ appli }) => {
  await menu(appli, 'Comparaisons');
  await appli.getByRole('button', { name: /S’entraîner à comparer/ }).click();
  await expect(appli.locator('[role=tab][aria-selected=true]')).toHaveText('Comparer');
  await menu(appli, 'Glossaire');
  await appli.getByRole('button', { name: /Réviser le glossaire/ }).click();
  await expect(appli.locator('[role=tab][aria-selected=true]')).toHaveText('Glossaire');
});
