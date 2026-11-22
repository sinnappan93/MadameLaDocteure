import { expect, menu, test } from './outils';

const ENTREES = [
  'Plan de révision', 'Projection', 'Bibliographie', 'Journal de visites', 'Identifier les œuvres', 'Quiz libre', 'Sujets blancs', 'Plan en 15 minutes',
  'Mes copies et corrections', 'Banque de sujets', 'Simulateur d’oral', 'Œuvres de référence', 'Comparaisons', 'Glossaire', 'Frise chronologique', 'Carte des sites',
  'Comment m’utiliser ?',
];

for (const theme of ['clair', 'sombre'] as const)
  for (const largeur of [360, 1280])
    test(`affichage ${theme}, ${largeur} px : aucun débordement horizontal, fond adapté au thème`, async ({ appli }) => {
      await appli.setViewportSize({ width: largeur, height: 800 });
      await appli.evaluate((t) => localStorage.setItem('madameladocteure:reglages', JSON.stringify({ prenom: '', theme: t, dateEcrits: '2027-07-01' })), theme);
      await appli.reload();
      await expect(appli.locator('html')).toHaveAttribute('data-theme', theme);
      const ecrans = ['Accueil', ...ENTREES];
      for (const e of ecrans) {
        if (e !== 'Accueil') await menu(appli, e);
        await appli.waitForTimeout(150);
        const deborde = await appli.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(deborde, `débordement sur « ${e} »`).toBeLessThanOrEqual(0);
      }
      const fond = await appli.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const [r, g, b] = fond.match(/\d+/g)!.map(Number);
      const clair = (r + g + b) / 3 > 128;
      expect(clair).toBe(theme === 'clair');
    });
