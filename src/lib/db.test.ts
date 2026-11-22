import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { oeuvreVide } from '../domain/types';
import { ajouterImage, Base, creerOeuvre, imagesDe, supprimerImage, supprimerOeuvre } from './db';

let base: Base;
beforeEach(async () => {
  base = new Base(`test-${crypto.randomUUID()}`);
  await base.open();
});

const image = () => new Blob(['x'], { type: 'image/jpeg' });

describe('stockage des œuvres', () => {
  it('la première image devient l’image principale, puis la suivante prend le relais', async () => {
    const o = await creerOeuvre({ ...oeuvreVide(), titre: 'Bouddha de Sarnath' }, base);
    const a = await ajouterImage(o.id, image(), { source: 'commons', licence: 'CC0' }, base);
    const b = await ajouterImage(o.id, image(), { source: 'photo' }, base);
    expect((await base.oeuvres.get(o.id))?.imagePrincipaleId).toBe(a.id);

    await supprimerImage(a.id, base);
    expect((await base.oeuvres.get(o.id))?.imagePrincipaleId).toBe(b.id);
    expect(await base.fichiers.count()).toBe(1);
  });

  it('supprimer une œuvre supprime ses images et fichiers', async () => {
    const o = await creerOeuvre({ ...oeuvreVide(), titre: 'Naṭarāja' }, base);
    await ajouterImage(o.id, image(), { source: 'url' }, base);
    await supprimerOeuvre(o.id, base);
    expect(await imagesDe(o.id, base)).toEqual([]);
    expect(await base.fichiers.count()).toBe(0);
    expect(await base.oeuvres.count()).toBe(0);
  });
});

describe('fiches de référence', () => {
  it('s’installent une fois, sans revenir après suppression ni écraser une modification', async () => {
    const { REFERENCES } = await import('../data/references');
    const { installerReferences, restaurerReferences, modifierOeuvre } = await import('./db');
    expect(await installerReferences(base)).toBe(REFERENCES.length);
    expect(await base.oeuvres.count()).toBe(REFERENCES.length);

    const [a, b] = REFERENCES;
    await supprimerOeuvre(a.id, base);
    await modifierOeuvre(b.id, { notes: 'mes notes' }, base);
    expect(await installerReferences(base)).toBe(0);
    expect(await base.oeuvres.get(a.id)).toBeUndefined();
    expect((await base.oeuvres.get(b.id))?.notes).toBe('mes notes');

    expect(await restaurerReferences(base)).toBe(1);
    expect((await base.oeuvres.get(a.id))?.reference).toBe(true);
    expect((await base.oeuvres.get(b.id))?.notes).toBe('mes notes');
  });

  it('ont des identifiants uniques et des périodes et aires connues', async () => {
    const { REFERENCES } = await import('../data/references');
    const { PERIODES, AIRES } = await import('../domain/catalogue');
    expect(new Set(REFERENCES.map((r) => r.id)).size).toBe(REFERENCES.length);
    for (const r of REFERENCES) {
      if (r.periodeId) expect(PERIODES.some((p) => p.id === r.periodeId), r.id).toBe(true);
      expect(AIRES.some((x) => x.id === r.aireId), r.id).toBe(true);
      if (r.debut !== undefined && r.fin !== undefined) expect(r.debut <= r.fin, r.id).toBe(true);
    }
  });
});

describe('mises à jour et images des fiches préparées', () => {
  it('corrige les fiches non modifiées et respecte les fiches personnalisées', async () => {
    const { REFERENCES } = await import('../data/references');
    const { installerReferences, mettreAJourReferences, modifierOeuvre } = await import('./db');
    await installerReferences(base);
    const [a, b] = REFERENCES;
    // Simule une ancienne version installée : titre différent.
    await base.oeuvres.update(a.id, { titre: 'Ancien titre' });
    await base.oeuvres.update(b.id, { titre: 'Mon titre' });
    await modifierOeuvre(b.id, { personnalisee: true }, base);
    expect(await mettreAJourReferences(base)).toBe(1);
    expect((await base.oeuvres.get(a.id))?.titre).toBe(a.titre);
    expect((await base.oeuvres.get(b.id))?.titre).toBe('Mon titre');
    expect(await mettreAJourReferences(base)).toBe(0);
  });

  it('télécharge une image par fiche préparée, une seule fois', async () => {
    const { REFERENCES } = await import('../data/references');
    const { installerReferences, supprimerImage, imagesDe: images } = await import('./db');
    const { telechargerImagesReferences } = await import('./imagesReferences');
    await installerReferences(base);
    const avecImage = REFERENCES.filter((r) => r.imageCommons);
    // Réponse simulée de Commons pour chaque fichier demandé.
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      const titres = new URL(url).searchParams.get('titles')!.split('|');
      const pages = titres.map((t) => ({ title: t, imageinfo: [{ url: `https://u/${t}`, descriptionurl: `https://c/${t}`, width: 100, height: 100, mime: 'image/jpeg', extmetadata: { LicenseShortName: { value: 'CC BY 4.0' } } }] }));
      return new Response(JSON.stringify({ query: { pages } }));
    }) as typeof fetch;
    try {
      const telecharger = async () => ({ blob: new Blob(['x'], { type: 'image/jpeg' }), largeur: 100, hauteur: 100 });
      expect(await telechargerImagesReferences(base, telecharger)).toBe(avecImage.length);
      const [premiere] = await images(avecImage[0].id, base);
      expect(premiere.licence).toBe('CC BY 4.0');
      await supprimerImage(premiere.id, base);
      expect(await telechargerImagesReferences(base, telecharger)).toBe(0);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});

describe('révisions', () => {
  it('enregistre les réponses et les efface avec la fiche', async () => {
    const { enregistrerReponse } = await import('./db');
    const o = await creerOeuvre({ ...oeuvreVide(), titre: 'Bayon' }, base);
    const carte = { id: `${o.id}:identifier`, oeuvreId: o.id, type: 'identifier' as const };
    await enregistrerReponse(carte, 2, new Date(), base);
    const e = await enregistrerReponse(carte, 2, new Date(), base);
    expect(e.intervalle).toBe(3);
    expect(e.revisions).toBe(2);
    await supprimerOeuvre(o.id, base);
    expect(await base.revisions.count()).toBe(0);
  });
});

describe('mode examen', () => {
  it('crée une copie, lui ajoute puis retire des photos, et la supprime avec ses fichiers', async () => {
    const { creerCopie, ajouterPhotoCopie, retirerPhotoCopie, supprimerCopie, modifierCopie } = await import('./db');
    const c = await creerCopie({ type: 'culture', sujetId: 'cg-ruine', sujet: 'La ruine.', mode: 'manuscrit', debut: new Date().toISOString(), dureePrevueMin: 240 }, base);
    await ajouterPhotoCopie(c.id, image(), base);
    await ajouterPhotoCopie(c.id, image(), base);
    let copie = await base.copies.get(c.id);
    expect(copie?.photos).toHaveLength(2);
    await retirerPhotoCopie(c.id, copie!.photos[0], base);
    await modifierCopie(c.id, { fin: new Date().toISOString() }, base);
    copie = await base.copies.get(c.id);
    expect(copie?.photos).toHaveLength(1);
    expect(copie?.fin).toBeDefined();
    await supprimerCopie(c.id, base);
    expect(await base.fichiers.count()).toBe(0);
  });
});

describe('oraux', () => {
  it('crée un oral, stocke ses enregistrements et les supprime avec lui', async () => {
    const { creerOral, enregistrerAudio, modifierOral, supprimerOral } = await import('./db');
    const { creerDossier } = await import('../domain/oral');
    const base = new Base(`test-oral-${Math.random()}`);
    const o = await creerOral({ dossier: creerDossier('theme', [], false, 'Angkor'), dureePrepMin: 30, dureeEpreuveMin: 30, dureeExposeMin: 10 }, base);
    expect(o).toMatchObject({ phase: 'preparation', notes: '', questions: [] });
    const expose = await enregistrerAudio(new Blob(['a']), undefined, base);
    // Sauvegarde partielle puis finale : même fichier, remplacé.
    await enregistrerAudio(new Blob(['ab']), expose, base);
    const reponse = await enregistrerAudio(new Blob(['c']), undefined, base);
    await modifierOral(o.id, { exposeAudio: expose, questions: [{ id: 'q', categorie: 'motivation', question: 'Q', attendu: '', audio: reponse }] }, base);
    expect(await base.fichiers.count()).toBe(2);
    expect((await base.fichiers.get(expose))?.blob.size).toBe(2);
    await supprimerOral(o.id, base);
    expect(await base.oraux.count()).toBe(0);
    expect(await base.fichiers.count()).toBe(0);
  });
});

describe('préparation', () => {
  it('enregistre le plan, coche une séance et le supprime', async () => {
    const { enregistrerPlan, lireDemandePlan, marquerSeance, supprimerPlan } = await import('./db');
    const { demandeParDefaut } = await import('../domain/plan');
    const d = demandeParDefaut('2027-07-01', '2026-11-23');
    await enregistrerPlan(d, [{ id: 's1', date: '2026-11-23', type: 'lecture', phase: 'fond', titre: 'Lecture', description: '', dureeMin: 30 }], base);
    await marquerSeance('s1', true, base);
    expect((await base.seances.get('s1'))?.faite).toBe(true);
    expect((await lireDemandePlan(base))?.dateEcrits).toBe('2027-07-01');
    await supprimerPlan(base);
    expect(await base.seances.count()).toBe(0);
    expect(await lireDemandePlan(base)).toBeUndefined();
  });

  it('transforme une photo de visite en fiche reliée à la visite', async () => {
    const { creerVisite, ficheDepuisPhoto, supprimerVisite } = await import('./db');
    const v = await creerVisite({ date: '2026-11-23', musee: 'Musée Guimet', salles: ['cambodge'] }, base);
    const o = await ficheDepuisPhoto(v.id, { ...oeuvreVide(), titre: 'Linteau', conservation: 'Musée Guimet (MG 1)' }, image(), image(), base);
    expect((await base.visites.get(v.id))?.oeuvreIds).toEqual([o.id]);
    const imgs = await imagesDe(o.id, base);
    // Les deux images sont ajoutées dans la même milliseconde : on ne dépend pas de leur ordre.
    expect(imgs.map((i) => i.titre).sort()).toEqual(['Cartel', 'Photo prise pendant la visite']);
    const principaleId = (await base.oeuvres.get(o.id))?.imagePrincipaleId;
    const principale = imgs.find((i) => i.id === principaleId);
    expect(principale?.titre).toBe('Photo prise pendant la visite');
    await supprimerVisite(v.id, base);
    expect(await base.oeuvres.get(o.id)).toBeDefined();
  });

  it('suit les pages lues', async () => {
    const { creerLecture, modifierLecture } = await import('./db');
    const { lirePages, avancement } = await import('../domain/preparation');
    const l = await creerLecture({ type: 'livre', titre: 'Huntington', auteurs: 'Susan L. Huntington', editeur: '', lien: '', aires: [], pagesTotal: 100 }, base);
    await modifierLecture(l.id, lirePages(l, 40, new Date('2026-11-23T10:00:00')), base);
    const l2 = (await base.lectures.get(l.id))!;
    expect(l2).toMatchObject({ pageActuelle: 40, statut: 'en-cours' });
    expect(l2.historique).toEqual([{ date: new Date('2026-11-23T10:00:00').toISOString(), jusqua: 40, pages: 40 }]);
    expect(lirePages(l2, 150)).toMatchObject({ pageActuelle: 100, statut: 'lu' });
    expect(avancement(l2)).toBe(0.4);
  });
});
