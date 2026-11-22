/**
 * Parcours de A à Z sur plusieurs jours, comme une utilisatrice : réglages, plan, révisions, lecture, sujet blanc,
 * visite, oral, puis suivi de la progression (cases cochées, projection) au fil des jours.
 */
import type { Seance } from '../src/domain/plan';
import { activerIA, expect, jouerSeance, lireTout, menu, photo, test } from './outils';

test('parcours complet sur trois jours', async ({ appli, reseau }) => {
  test.setTimeout(240_000);
  // Jour 1 (lundi 23 novembre) : installation, réglages, IA, plan.
  await appli.getByLabel('Ouvrir le menu').click();
  await appli.locator('.section-menu summary', { hasText: 'Réglages' }).click();
  await appli.getByLabel('Prénom').fill('Alaini');
  await appli.getByLabel('Fermer le menu').click();
  await expect(appli.locator('.hero h1')).toHaveText('Bonjour Alaini');
  await activerIA(appli);
  await appli.locator('.plan-invitation').click();
  await appli.getByRole('button', { name: 'Générer mon plan' }).click();
  await expect(appli.locator('.jour-plan').first()).toBeVisible();
  // Séances du jour depuis l'accueil.
  await appli.getByLabel('Retour').click();
  const duJour = appli.locator('.bloc-aujourdhui .seance');
  await expect(duJour).toHaveCount(2);
  await duJour.first().getByRole('button', { name: 'Commencer' }).click();
  await appli.getByRole('button', { name: /^Commencer/ }).click();
  await jouerSeance(appli, 2);
  await appli.getByRole('button', { name: 'Accueil' }).click();
  await expect(appli.locator('.bloc-aujourdhui .seance').first()).toHaveClass(/faite/);
  // Lecture du jour : ajout d'un livre et pages lues.
  await appli.locator('.bloc-aujourdhui .seance').nth(1).getByRole('button', { name: 'Commencer' }).click();
  await appli.locator('.suggestion', { hasText: 'Harle' }).getByRole('button', { name: '+ Ajouter' }).click();
  await appli.locator('.lecture-ligne').first().click();
  await appli.getByLabel('J’ai lu jusqu’à la page').fill('25');
  await appli.getByRole('button', { name: 'Noter' }).click();
  await menu(appli, 'Accueil');
  await expect(appli.locator('.bloc-aujourdhui .seance.faite')).toHaveCount(2);

  // Jour 2 (mardi 24) : révision du lendemain, plan en 15 minutes commenté.
  await appli.clock.setSystemTime(new Date('2026-11-24T08:30:00+01:00'));
  await appli.reload();
  await expect(appli.locator('.bloc-aujourdhui .jour-plan h3')).toHaveText('Aujourd’hui');
  await menu(appli, 'Plan en 15 minutes');
  await appli.getByRole('button', { name: /Commencer/ }).click();
  await appli.getByLabel('Problématique').fill('Problématique du jour 2');
  await appli.getByLabel('Plan détaillé').fill('I.\nII.');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await appli.getByRole('button', { name: 'Faire commenter mon plan' }).click();
  await expect(appli.locator('.plan-propose')).toBeVisible();

  // Jour 6 (samedi 28) : sujet blanc de spécialité prévu par le plan, corrigé par l'IA.
  await appli.clock.setSystemTime(new Date('2026-11-28T09:00:00+01:00'));
  await appli.reload();
  await expect(appli.locator('.bloc-aujourdhui .seance-titre')).toHaveText(['Sujet blanc : dissertation de spécialité']);
  await appli.locator('.bloc-aujourdhui .seance').getByRole('button', { name: 'Commencer' }).click();
  await appli.getByRole('button', { name: /Commencer · 4 h/ }).click();
  await appli.locator('.copie-texte').fill('Introduction de ma dissertation.');
  await appli.getByRole('button', { name: 'Rendre la copie' }).click();
  await appli.getByRole('button', { name: 'Faire corriger ma copie' }).click();
  await expect(appli.locator('.note-globale')).toContainText('13,5');
  await menu(appli, 'Accueil');
  await expect(appli.locator('.bloc-aujourdhui .seance.faite')).toHaveCount(1);

  // Une visite au Guimet, une œuvre photographiée devient une fiche.
  await menu(appli, 'Journal de visites');
  await appli.getByRole('button', { name: /Nouvelle visite aujourd’hui/ }).click();
  await appli.getByRole('button', { name: 'Inde' }).click();
  await appli.locator('.visites > .bloc .depot-photo input').setInputFiles(photo('bouddha.png'));
  await appli.getByLabel('Titre (d’après le cartel)').fill('Bouddha debout (visite)');
  await appli.getByRole('button', { name: 'Créer la fiche' }).click();
  await expect(appli.locator('.oeuvre-liee-bouton', { hasText: 'Bouddha debout (visite)' })).toBeVisible();

  // Un oral blanc.
  await menu(appli, 'Simulateur d’oral');
  await appli.getByRole('button', { name: /Tirer le dossier/ }).click();
  await appli.locator('#notes-oral').fill('Plan d’oral');
  await appli.getByRole('button', { name: /Commencer l’exposé/ }).click();
  await appli.waitForTimeout(1200);
  await appli.getByRole('button', { name: /Terminer l’exposé/ }).click();
  await appli.locator('#resume-expose').fill('Mon exposé portait sur…');
  await appli.getByRole('button', { name: 'Passer aux questions du jury' }).click();
  await appli.getByRole('button', { name: /^🎙 Répondre$/ }).click();
  await appli.waitForTimeout(800);
  await appli.getByRole('button', { name: /Fin de ma réponse/ }).click();
  await appli.getByRole('button', { name: 'Arrêter l’oral ici' }).click();
  await appli.getByRole('button', { name: 'Demander le bilan du jury' }).click();
  await expect(appli.locator('.note-globale')).toContainText('14');

  // Bilan de la semaine : plan, projection, IA.
  await menu(appli, 'Plan de révision');
  await appli.getByRole('button', { name: 'Semaine précédente' }).click();
  await appli.getByRole('button', { name: 'Semaine suivante' }).click();
  await expect(appli.locator('.bilan-semaine')).toContainText(/^\d+ \/ \d+ séances/);
  const faites = (await lireTout<Seance>(appli, 'seances')).filter((s) => s.faite).length;
  expect(faites).toBe(0); // tout a été coché automatiquement par l'appli, rien à la main
  await menu(appli, 'Projection');
  await expect(appli.locator('.tendances li')).toContainText(['Spécialité : 13,5/20 sur une seule copie']);
  await expect(appli.locator('.ligne-pret', { hasText: 'Oral sur dossier' })).toContainText('·');
  expect(reseau.appelsIA.map((a) => a.type)).toEqual(['plan', 'correction', 'questions', 'bilan']);
  expect(new Set(reseau.appelsIA.map((a) => a.modele))).toEqual(new Set(['claude-opus-5-5']));
});
