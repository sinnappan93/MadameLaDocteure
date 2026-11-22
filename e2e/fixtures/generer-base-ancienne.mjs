/**
 * Génère une base « ancienne » réelle pour le test de mise à jour : on ouvre une version publiée de l'appli
 * (construite depuis un ancien commit), on y crée des données comme une utilisatrice, puis on exporte la base
 * IndexedDB (schéma exact et contenu) en JSON.
 *
 * Usage :
 *   git worktree add /tmp/ancienne <commit> && (cd /tmp/ancienne && npm ci && npx vite build --outDir /tmp/dist-ancienne)
 *   node e2e/fixtures/generer-base-ancienne.mjs /tmp/dist-ancienne e2e/fixtures/base-<version>.json [oral]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const [dist, sortie, avecOral] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.json': 'application/json' };

const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
const p = await ctx.newPage();
const outil = await ctx.newPage();
await outil.setContent('<body style="margin:0;width:300px;height:400px;background:#b98"></body>');
const PNG = await outil.screenshot({ clip: { x: 0, y: 0, width: 300, height: 400 } });
await outil.close();
p.on('dialog', (d) => d.accept());
await p.route(/wikimedia|arcgisonline|openstreetmap|anthropic/, (r) => r.abort());
await p.route('http://localhost:4173/**', (r) => {
  const chemin = new URL(r.request().url()).pathname;
  const fichier = join(dist, chemin === '/' ? 'index.html' : chemin);
  if (!existsSync(fichier)) return r.fulfill({ status: 404 });
  return r.fulfill({ status: 200, contentType: TYPES[extname(fichier)] ?? 'application/octet-stream', body: readFileSync(fichier) });
});
await p.goto('http://localhost:4173/');
await p.waitForTimeout(2500);
const menu = async (nom) => {
  // Une feuille encore ouverte (ajout d'image) : on la ferme.
  if (await p.locator('.feuille-fond:not(.tiroir-fond)').isVisible()) await p.getByLabel('Fermer', { exact: true }).click();
  await p.getByLabel('Ouvrir le menu').click();
  await p.locator('.entree-menu', { has: p.locator('.entree-nom', { hasText: new RegExp(`^${nom}$`) }) }).click();
  await p.waitForTimeout(500);
};

// Une fiche créée à la main, avec une photo.
await menu('Œuvres de référence');
await p.getByLabel('Nouvelle fiche').click();
await p.getByLabel('Titre *').fill('Fiche ancienne avec photo');
await p.getByRole('button', { name: 'Enregistrer' }).click();
await p.waitForTimeout(400);
await p.getByRole('button', { name: /Ajouter une image|Trouver une image/ }).first().click();
await p.getByRole('tab', { name: 'Photo' }).click();
await p.locator('.depot input[type=file]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: PNG });
await p.waitForTimeout(1500);
// Une fiche préparée modifiée, une autre supprimée.
await menu('Œuvres de référence');
await p.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill('Prêtre-roi');
await p.locator('.carte-oeuvre').first().click();
await p.getByRole('button', { name: 'Modifier' }).click();
await p.getByLabel('Notes / points à retenir').fill('Notes personnelles (ancienne version)');
await p.getByRole('button', { name: 'Enregistrer' }).click();
await p.waitForTimeout(400);
await menu('Œuvres de référence');
await p.getByPlaceholder('Rechercher une œuvre, un site, une dynastie…').fill('Danseuse');
await p.locator('.carte-oeuvre').first().click();
await p.getByRole('button', { name: 'Supprimer' }).click();
await p.waitForTimeout(400);
// Révisions : glossaire.
await menu('Glossaire en cartes');
await p.getByRole('button', { name: /^Commencer/ }).click();
for (let i = 0; i < 5; i++) {
  await p.getByRole('button', { name: /^Voir la/ }).click();
  await p.locator('.note-2').click();
  await p.waitForTimeout(150);
}
// Une copie rendue et un sujet de jury.
await menu('Sujets blancs');
await p.getByRole('button', { name: /Commencer/ }).click();
await p.locator('.copie-texte').fill('Copie écrite avec l’ancienne version.');
await p.waitForTimeout(1200);
await p.getByRole('button', { name: 'Rendre la copie' }).click();
await p.waitForTimeout(400);
await menu('Banque de sujets');
await p.getByRole('button', { name: '+ Ajouter un sujet' }).click();
await p.getByLabel('Intitulé').fill('Sujet de jury (ancienne version)');
await p.getByRole('button', { name: 'Enregistrer le sujet' }).click();
await p.waitForTimeout(300);
if (avecOral) {
  await menu('Simulateur d’oral');
  await p.getByRole('button', { name: /Tirer le dossier/ }).click();
  await p.locator('#notes-oral').fill('Notes d’oral (ancienne version)');
  await p.locator('#notes-oral').blur();
  await p.getByRole('button', { name: /Commencer l’exposé/ }).click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Terminer l’exposé/ }).click();
  await p.waitForTimeout(500);
}

// Export : schéma exact et contenu (fichiers en base64).
const base = await p.evaluate(async () => {
  const db = await new Promise((ok) => {
    const r = indexedDB.open('madameladocteure');
    r.onsuccess = () => ok(r.result);
  });
  const enTexte = (blob) => new Promise((ok) => { const l = new FileReader(); l.onload = () => ok(String(l.result)); l.readAsDataURL(blob); });
  const stores = [];
  const donnees = {};
  for (const nom of db.objectStoreNames) {
    const s = db.transaction(nom).objectStore(nom);
    stores.push({ nom, keyPath: s.keyPath, autoIncrement: s.autoIncrement, index: [...s.indexNames].map((i) => { const x = s.index(i); return { nom: x.name, keyPath: x.keyPath, unique: x.unique, multiEntry: x.multiEntry }; }) });
    const lignes = await new Promise((ok) => { const q = db.transaction(nom).objectStore(nom).getAll(); q.onsuccess = () => ok(q.result); });
    donnees[nom] = await Promise.all(lignes.map(async (l) => (l.blob instanceof Blob ? { ...l, blob: { __blob: await enTexte(l.blob) } } : l)));
  }
  return { version: db.version, stores, donnees };
});
writeFileSync(sortie, JSON.stringify(base));
console.log(`${sortie} : version ${base.version}, ${base.stores.map((s) => `${s.nom} (${base.donnees[s.nom].length})`).join(', ')}`);
await b.close();
