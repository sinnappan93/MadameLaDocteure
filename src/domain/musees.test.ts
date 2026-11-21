import { describe, expect, it } from 'vitest';
import aic from './__fixtures__/aic-recherche.json';
import cleveland from './__fixtures__/cleveland-recherche.json';
import met from './__fixtures__/met-objet.json';
import { datationNotice, lireAic, lireCleveland, lireIdsMet, lireObjetMet, urlRechercheAic } from './musees';

// Réponses réelles des API (novembre 2026), enregistrées dans __fixtures__.
describe('notices de musées', () => {
  it('lit une notice de Cleveland avec description, provenance et bibliographie', () => {
    const [n] = lireCleveland(cleveland);
    expect(n.titre).toBe('Nataraja, Shiva as the Lord of Dance');
    expect(n.inventaire).toBe('1930.331');
    expect(n.materiau).toBe('Bronze');
    expect(n.dimensions).toContain('113 x 102 x 30 cm');
    expect(n.description).toMatch(/^One of the most celebrated/);
    expect(n.provenance?.[0]).toContain('C.T. Loo');
    expect(n.bibliographie?.length).toBeGreaterThan(10);
    expect(n.bibliographie?.[0]).not.toContain('<em>');
    expect(n.image).toBe('https://openaccess-cdn.clevelandart.org/1930.331/1930.331_web.jpg');
    expect(datationNotice(n)).toBe('XIe s.');
  });

  it('lit un objet du Met', () => {
    const n = lireObjetMet(met)!;
    expect(n.titre).toBe('Shiva as Lord of Dance (Nataraja)');
    expect(n.inventaire).toBe('1987.80.1');
    expect(n.datation).toBe('ca. late 11th century');
    expect(n.culture).toContain('Chola period');
    expect(n.lien).toBe('https://www.metmuseum.org/art/collection/search/39328');
    expect(lireObjetMet({ ...met, isPublicDomain: false })).toBeUndefined();
    expect(lireIdsMet({ total: 2, objectIDs: [1, 2] })).toEqual([1, 2]);
    expect(lireIdsMet({ total: 0, objectIDs: null })).toEqual([]);
  });

  it('lit les notices de Chicago avec images IIIF', () => {
    const notices = lireAic(aic);
    expect(notices[0].inventaire).toBe('1965.1130');
    expect(notices[0].image).toMatch(/^https:\/\/www\.artic\.edu\/iiif\/2\/.+\/full\/843,\/0\/default\.jpg$/);
    expect(notices[0].description).toMatch(/^Shiva, one of the most important/);
    expect(new URL(urlRechercheAic('Buddha')).searchParams.get('query[term][is_public_domain]')).toBe('true');
  });
});
