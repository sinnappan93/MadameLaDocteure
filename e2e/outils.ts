/**
 * Outils communs des tests de bout en bout : réseau simulé, horloge fixée, erreurs de console surveillées,
 * navigation dans le menu et lecture de la base IndexedDB.
 */
import { test as base, expect, type Page, type Route } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import aic from '../src/domain/__fixtures__/aic-recherche.json' with { type: 'json' };
import cleveland from '../src/domain/__fixtures__/cleveland-recherche.json' with { type: 'json' };
import met from '../src/domain/__fixtures__/met-objet.json' with { type: 'json' };

/** Lundi 23 novembre 2026, 9 h (heure de Paris) : toutes les dates des tests en découlent. */
export const AUJOURDHUI = '2026-11-23';
export const MAINTENANT = new Date('2026-11-23T09:00:00+01:00');

// ——— Images PNG générées (sans dépendance) ———

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Buffer) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function bloc(type: string, data: Buffer) {
  const t = Buffer.from(type);
  const l = Buffer.alloc(4);
  l.writeUInt32BE(data.length);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}
/** PNG uni de la couleur donnée. */
export function png(largeur: number, hauteur: number, [r, g, b]: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const ligne = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: largeur }, () => [r, g, b]).flat())]);
  const brut = Buffer.concat(Array.from({ length: hauteur }, () => ligne));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', deflateSync(brut)), bloc('IEND', Buffer.alloc(0))]);
}
const couleur = (texte: string): [number, number, number] => {
  let h = 0;
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [80 + (h % 150), 80 + ((h >> 8) % 150), 80 + ((h >> 16) % 150)];
};
const TUILE = png(256, 256, [222, 214, 196]);

// ——— IA simulée ———

export interface AppelIA {
  type: 'correction' | 'plan' | 'sujets' | 'questions' | 'bilan';
  modele: string;
  effort: string;
  fallbacks: unknown;
  beta: string;
  images: number;
  texte: string;
}

function reponseIA(props: Record<string, unknown>) {
  if (props.criteres)
    return {
      criteres: ['Problématique', 'Structure et plan', 'Précision des exemples', 'Références aux œuvres', 'Expression et rigueur'].map((c, i) => ({ critere: c, note: 2.5 + i * 0.5, commentaire: `Commentaire sur ${c}.` })),
      note_sur_20: 13.5,
      appreciation: 'Copie solide, exemples à préciser.',
      points_forts: ['Plan clair'],
      a_ameliorer: ['Dater précisément'],
      conseils: ['Mobiliser le Bouddha de Sarnath'],
    };
  if (props.plan_propose)
    return {
      appreciation: 'Bonne base.',
      problematique: 'Bien posée.',
      plan: 'Équilibré.',
      points_forts: ['Clarté'],
      a_ameliorer: ['Transitions'],
      plan_propose: { problematique: 'Comment… ?', parties: [{ titre: 'I. Débuts', sous_parties: ['A.', 'B.'] }, { titre: 'II. Classicisme', sous_parties: ['A.', 'B.'] }] },
    };
  if (props.relances)
    return {
      relances: [
        { question: 'Pouvez-vous préciser la datation de la deuxième œuvre ?', attendu: 'Critères stylistiques.' },
        { question: 'Quel lien entre les deux premières œuvres ?', attendu: 'Atelier, iconographie.' },
      ],
      motivation: [{ question: 'Pourquoi le patrimoine ?', attendu: 'Un projet précis.' }],
      situations: [{ question: 'Un musée demande un prêt. Que faites-vous ?', attendu: 'Constat d’état, convoiement.' }],
    };
  if (props.par_question)
    return {
      appreciation: 'Exposé clair, réponses à étoffer.',
      note_sur_20: 14,
      points_forts: ['Gestion du temps'],
      a_ameliorer: ['Préciser les dates'],
      conseils: ['S’entraîner aux mises en situation'],
      par_question: [{ question: 'Pourquoi le patrimoine ?', commentaire: 'Sincère mais général.' }],
    };
  return { sujets: ['Le stūpa, de l’Inde à Java.', 'Les bronzes pāla.', 'Le stūpa, de l’Inde à Java.'] };
}

// ——— Réseau simulé ———

export interface Reseau {
  appelsIA: AppelIA[];
  /** Code d'erreur renvoyé par l'IA (401, 429…) ; 0 : réponses normales. */
  erreurIA: number;
}

export async function simulerReseau(page: Page, reseau: Reseau) {
  const corsJson = (route: Route, corps: unknown, status = 200) =>
    route.fulfill({ status, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify(corps) });
  const image = (route: Route) => route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'image/png' }, body: png(64, 48, couleur(route.request().url())) });

  await page.route('https://commons.wikimedia.org/w/api.php**', (route) => {
    const p = new URL(route.request().url()).searchParams;
    const titres = p.get('titles')?.split('|') ?? (p.get('generator') ? ['File:Recherche A.jpg', 'File:Recherche B.jpg', 'File:Recherche C.jpg'] : []);
    const pages = titres.map((title, index) => ({
      title,
      index,
      imageinfo: [
        {
          url: `https://upload.wikimedia.org/test/${encodeURIComponent(title)}.png`,
          thumburl: `https://upload.wikimedia.org/test/${encodeURIComponent(title)}.png`,
          descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
          width: 800,
          height: 600,
          mime: 'image/png',
          extmetadata: { Artist: { value: 'Auteur test' }, LicenseShortName: { value: 'CC BY-SA 4.0' } },
        },
      ],
    }));
    return corsJson(route, { query: { pages } });
  });
  await page.route(/upload\.wikimedia\.org|images\.metmuseum\.org|openaccess-cdn\.clevelandart\.org|www\.artic\.edu\/iiif/, image);
  await page.route(/server\.arcgisonline\.com|tile\.openstreetmap\.org|basemaps\.cartocdn\.com/, (route) =>
    route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'image/png' }, body: TUILE }),
  );
  await page.route('https://openaccess-api.clevelandart.org/**', (route) => corsJson(route, cleveland));
  await page.route('https://collectionapi.metmuseum.org/public/collection/v1.1/search**', (route) => corsJson(route, { total: 1, objectIDs: [(met as { objectID: number }).objectID] }));
  await page.route('https://collectionapi.metmuseum.org/public/collection/v1/objects/**', (route) => corsJson(route, met));
  await page.route('https://api.artic.edu/**', (route) => corsJson(route, aic));
  await page.route('https://api.anthropic.com/**', async (route) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const corps = route.request().postDataJSON();
    const props = corps.output_config.format.schema.properties;
    const contenu = corps.messages[0].content as Array<{ type: string; text?: string }>;
    reseau.appelsIA.push({
      type: props.criteres ? 'correction' : props.plan_propose ? 'plan' : props.relances ? 'questions' : props.par_question ? 'bilan' : 'sujets',
      modele: corps.model,
      effort: corps.output_config.effort,
      fallbacks: corps.fallbacks,
      beta: route.request().headers()['anthropic-beta'] ?? '',
      images: contenu.filter((c) => c.type === 'image').length,
      texte: contenu.map((c) => c.text ?? '').join('\n'),
    });
    if (reseau.erreurIA)
      return route.fulfill({
        status: reseau.erreurIA,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'error', error: { type: reseau.erreurIA === 401 ? 'authentication_error' : 'rate_limit_error', message: 'simulée' } }),
      });
    await route.fulfill({
      status: 200,
      headers: { ...cors, 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: corps.model,
        content: [{ type: 'text', text: JSON.stringify(reponseIA(props)) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    });
  });
}

// ——— Fixture de test ———

export const test = base.extend<{ reseau: Reseau; erreurs: string[]; appli: Page }>({
  reseau: async ({}, use) => use({ appelsIA: [], erreurIA: 0 }),
  erreurs: async ({ page }, use) => {
    const erreurs: string[] = [];
    page.on('pageerror', (e) => erreurs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') erreurs.push(`console: ${m.text()}`);
    });
    page.on('dialog', (d) => d.accept());
    await use(erreurs);
  },
  /** L'application ouverte sur l'accueil, fiches préparées installées et images téléchargées. */
  appli: async ({ page, reseau, erreurs }, use) => {
    await simulerReseau(page, reseau);
    await page.clock.install({ time: MAINTENANT });
    await page.goto('/');
    await attendreInstallation(page);
    await use(page);
    // Non-régression : aucun écran ne doit produire d'erreur JavaScript.
    expect(erreurs, 'erreurs dans la console').toEqual([]);
  },
});
export { expect };

/** Attend l'installation des 51 fiches préparées et le téléchargement de leurs images. */
export async function attendreInstallation(page: Page) {
  await expect.poll(() => compter(page, 'oeuvres'), { timeout: 20_000 }).toBeGreaterThanOrEqual(51);
  await expect.poll(async () => ((await lireMeta(page, 'images-references-traitees')) as string[] | undefined)?.length ?? 0, { timeout: 30_000 }).toBeGreaterThanOrEqual(50);
}

// ——— Base IndexedDB ———

export async function lireTout<T = Record<string, unknown>>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(
    (t) =>
      new Promise<T[]>((ok, ko) => {
        const r = indexedDB.open('madameladocteure');
        r.onerror = () => ko(r.error);
        r.onsuccess = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains(t)) return ok([]);
          const q = db.transaction(t).objectStore(t).getAll();
          q.onsuccess = () => {
            ok(q.result as T[]);
            db.close();
          };
        };
      }),
    table,
  );
}
export const compter = async (page: Page, table: string) => (await lireTout(page, table)).length;
export async function lireMeta(page: Page, cle: string): Promise<unknown> {
  return (await lireTout<{ cle: string; valeur: unknown }>(page, 'meta')).find((m) => m.cle === cle)?.valeur;
}

/** Écrit des enregistrements dans la base (jeux de données), puis recharge l'application. */
export async function ecrire(page: Page, donnees: Record<string, unknown[]>, recharger = true) {
  await page.evaluate(
    (d) =>
      new Promise<void>((ok, ko) => {
        const r = indexedDB.open('madameladocteure');
        r.onerror = () => ko(r.error);
        r.onsuccess = () => {
          const db = r.result;
          const tx = db.transaction(Object.keys(d), 'readwrite');
          for (const [t, lignes] of Object.entries(d)) for (const l of lignes) tx.objectStore(t).put(l);
          tx.oncomplete = () => {
            db.close();
            ok();
          };
          tx.onerror = () => ko(tx.error);
        };
      }),
    donnees,
  );
  if (recharger) {
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
  }
}

// ——— Navigation ———

/** Ouvre une entrée du menu par son nom exact. */
export async function menu(page: Page, nom: string) {
  await page.getByLabel('Ouvrir le menu').click();
  const exact = new RegExp(`^${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const entree = page.locator('.entree-menu', { has: page.locator('.entree-nom', { hasText: exact }) });
  // Sections repliées (Aide) : on les ouvre d'abord.
  if (!(await entree.isVisible())) await page.locator('.section-menu:not([open])', { has: entree }).locator('summary').click();
  await entree.click();
  await expect(page.locator('.tiroir')).toHaveCount(0);
}

/** Active l'IA (clé fictive et accord) dans les réglages. */
export async function activerIA(page: Page) {
  await page.getByLabel('Ouvrir le menu').click();
  await page.locator('.section-menu summary', { hasText: 'Réglages' }).click();
  await page.getByLabel('Clé d’API').fill('sk-ant-api03-cle-de-test-0000000000');
  await page.locator('.reglages-ia .case input').check();
  await expect(page.locator('.etat-ia')).toHaveText('✓ IA prête');
  await page.getByLabel('Fermer le menu').click();
}

/** Image PNG pour les champs « photo ». */
export const photo = (nom = 'photo.png') => ({ name: nom, mimeType: 'image/png', buffer: png(600, 800, couleur(nom)) });

/** Joue une séance de révision ou un quiz jusqu'au bout ; renvoie le nombre de cartes jouées et les consignes vues. */
export async function jouerSeance(page: Page, note: 0 | 1 | 2 | 3 = 2, maximum = 60): Promise<{ cartes: number; consignes: string[] }> {
  const consignes: string[] = [];
  for (let n = 0; n < maximum; n++) {
    if (await page.locator('.fin-titre').isVisible()) return { cartes: n, consignes };
    await expect(page.locator('.progression-seance').or(page.locator('.fin-titre')).first()).toBeVisible();
    if (await page.locator('.fin-titre').isVisible()) return { cartes: n, consignes };
    const consigne = page.locator('.consigne, .carte-mot-definition').first();
    await expect(consigne).toBeVisible();
    consignes.push(await consigne.innerText());
    const position = await page.locator('.progression-seance').getAttribute('aria-label');
    const voir = page.getByRole('button', { name: /^Voir (la réponse|la définition|la traduction|les critères)$/ });
    const carte = page.locator('.carte-leaflet.quiz');
    const option = page.locator('.option:not([disabled])').first();
    await expect(voir.or(carte).or(option).first()).toBeVisible();
    if (await voir.isVisible()) {
      await voir.click();
      await page.locator(`.note-${note}`).click();
    } else if (await carte.isVisible()) {
      await carte.click({ position: { x: 150, y: 120 } });
      await page.getByRole('button', { name: 'Continuer' }).click();
    } else {
      await option.click();
      await page.getByRole('button', { name: 'Continuer' }).click();
    }
    // Attend la carte suivante (ou la fin) avant de continuer.
    await expect
      .poll(() => page.evaluate((avant) => !!document.querySelector('.fin-titre') || document.querySelector('.progression-seance')?.getAttribute('aria-label') !== avant, position))
      .toBe(true);
  }
  throw new Error('Séance trop longue');
}
