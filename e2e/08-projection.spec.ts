import { VOCABULAIRE } from '../src/data/anglais';
import { GLOSSAIRE } from '../src/data/glossaire';
import { REFERENCES } from '../src/data/references';
import { cleJour } from '../src/domain/plan';
import { couvertureProgramme, GROUPES, instantane, memorisation, notesDesSujets, pretPour, projeterCouverture } from '../src/domain/projection';
import type { Oeuvre } from '../src/domain/types';
import { copies, historique, oraux, revisions } from './donnees';
import { AUJOURDHUI, ecrire, expect, menu, test } from './outils';

const pct = (x: number) => `${Math.round(x * 100)} %`;
const dateLongue = (j: string) => new Date(`${j}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ');

test('projection : chiffres conformes aux données (jeu « préparation en cours »)', async ({ appli }) => {
  const aire = new Map(REFERENCES.map((r) => [r.id, r.aireId]));
  await ecrire(appli, { revisions, copies, oraux, meta: [{ cle: 'instantanes', valeur: historique((id) => aire.get(id)) }] });
  // Valeurs attendues, calculées par la logique métier à partir des mêmes données.
  const oeuvres = REFERENCES.map((r) => ({ ...r, etiquettes: [], creeeLe: '', modifieeLe: '' })) as unknown as Oeuvre[];
  const couverture = couvertureProgramme(oeuvres, revisions);
  const memo = memorisation(oeuvres, revisions, { glossaire: GLOSSAIRE.length, anglais: VOCABULAIRE.length });
  const notes = notesDesSujets(copies as never);
  const bilans = pretPour({ couverture, memo, notes, oraux: oraux as never });
  const actuel = instantane(couverture, AUJOURDHUI);
  const projections = GROUPES.map((g) => projeterCouverture(g.nom, g.aires, historique((id) => aire.get(id)), actuel, AUJOURDHUI, '2027-07-01'));

  await menu(appli, 'Projection');
  await expect(appli.locator('.tuile-pret')).toHaveText([new RegExp(`Prêt pour l’écrit${pct(bilans.globalEcrit.score)}`), new RegExp(`Prêt pour l’oral${pct(bilans.globalOral.score)}`)]);
  await expect(appli.locator('.ligne-pret-niveau')).toHaveText([...bilans.ecrit, ...bilans.oral].map((p) => new RegExp(`^${pct(p.score)} · ${p.niveau}${p.incomplet ? ' · incomplet' : ''}$`)));
  await expect(appli.locator('.projection > p.discret').first()).toContainText(`${couverture.couvertes} périodes sur ${couverture.total}`);
  await expect(appli.locator('.stats-projection .stat-valeur')).toHaveText([pct(memo.maitrisees / memo.total), pct(memo.reussite!), pct(memo.glossaire), pct(memo.anglais)]);
  // Notes : celle du correcteur (13) prime sur l'IA (12,5).
  await expect(appli.locator('.tendances li').first()).toContainText('Spécialité : 11,2/20 en moyenne sur les 3 dernières (+3,2 par rapport aux 3 précédentes)');
  await expect(appli.locator('.tendances li').nth(1)).toContainText('Culture générale : 13/20 sur une seule copie');
  await appli.locator('.table-notes').evaluate((t) => t.closest('details')!.setAttribute('open', ''));
  await expect(appli.locator('.table-notes tbody tr')).toHaveCount(5);
  await expect(appli.locator('.table-notes tbody tr').first()).toContainText('13correcteur');
  // Dates de couverture.
  expect(projections.map((p) => p.etat)).toContain('estime');
  for (const p of projections) {
    const phrase = appli.locator('.phrase-projection', { hasText: p.nom.slice(1) });
    if (p.etat === 'estime') await expect(phrase).toContainText(`vers le ${dateLongue(p.date!)}, soit ${p.avantEcrits ? 'avant' : 'après'} les écrits`);
    else await expect(phrase).toContainText('aucune nouvelle œuvre maîtrisée ces dernières semaines');
  }
  // Aperçu de l'accueil : mêmes valeurs.
  await appli.getByLabel('Retour').click();
  await expect(appli.locator('.apercu-projection .tuile-pret-valeur')).toHaveText([pct(bilans.globalEcrit.score), pct(bilans.globalOral.score)]);
  await expect(appli.locator('.apercu-projection .couverture-globale')).toContainText(`${couverture.couvertes}/${couverture.total} périodes`);
  await expect(appli.locator('.apercu-projection .phrase-projection')).toHaveCount(projections.filter((p) => p.etat === 'estime' || p.etat === 'stagne').length);
});

test('projection : sans recul, la date est annoncée pour plus tard ; photo du jour enregistrée', async ({ appli }) => {
  await menu(appli, 'Projection');
  await expect(appli.locator('.phrase-projection').first()).toContainText('estimée à partir du 30 novembre 2026');
  const h = await appli.evaluate(() => new Promise<unknown>((ok) => {
    const r = indexedDB.open('madameladocteure');
    r.onsuccess = () => { const q = r.result.transaction('meta').objectStore('meta').get('instantanes'); q.onsuccess = () => ok(q.result?.valeur); };
  }));
  expect((h as Array<{ date: string }>).map((x) => x.date)).toEqual([cleJour(new Date('2026-11-23T12:00:00'))]);
});

test('lacunes mesurées : le plan cible les aires faibles et les épreuves aux notes basses', async ({ appli }) => {
  await ecrire(appli, { revisions, copies, oraux });
  await appli.locator('.plan-invitation').click();
  await expect(appli.locator('.constats li').first()).toContainText('Aires à travailler');
  await expect(appli.locator('.constats li').nth(1)).toHaveText(`Glossaire maîtrisé à ${Math.round(((0.7 * 20 + 0.3 * 20) / GLOSSAIRE.length) * 100)} %, vocabulaire anglais à ${Math.round(((0.7 * 10 + 0.3 * 10) / VOCABULAIRE.length) * 100)} %.`);
  await expect(appli.locator('.constats li').nth(2)).toContainText('Dissertation de spécialité : 10,4/20 en moyenne ; culture générale : 13,0/20 en moyenne ; synthèse : pas encore de copie corrigée.');
});
