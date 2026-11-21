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
