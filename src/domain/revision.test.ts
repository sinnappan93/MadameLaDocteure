import { describe, expect, it } from 'vitest';
import { periodeParId } from './catalogue';
import { apercuIntervalles, bilan, composerSeance, type EtatCarte, estDue, idCarte, noter, optionsPeriode } from './revision';
import { type Oeuvre, oeuvreVide } from './types';

const maintenant = new Date(2026, 10, 22, 9, 0);
const carte = { oeuvreId: 'o1', type: 'identifier' as const };
const oeuvre = (id: string, extra: Partial<Oeuvre> = {}): Oeuvre => ({
  ...oeuvreVide(),
  id,
  titre: id,
  imagePrincipaleId: `img-${id}`,
  periodeId: 'gupta',
  aireId: 'inde-nord',
  creeeLe: '',
  modifieeLe: '',
  ...extra,
});
// Hasard déterministe.
const hasard = () => 0.42;

describe('répétition espacée', () => {
  it('allonge les intervalles quand on réussit', () => {
    const e1 = noter(undefined, carte, 2, maintenant);
    expect(e1.intervalle).toBe(1);
    const e2 = noter(e1, carte, 2, maintenant);
    expect(e2.intervalle).toBe(3);
    const e3 = noter(e2, carte, 2, maintenant);
    expect(e3.intervalle).toBe(8); // 3 × 2,5 arrondi
    expect(e3.repetitions).toBe(3);
  });

  it('remet à zéro et baisse la facilité après une erreur', () => {
    const e = noter(noter(noter(undefined, carte, 2, maintenant), carte, 2, maintenant), carte, 0, maintenant);
    expect(e.intervalle).toBe(0);
    expect(e.repetitions).toBe(0);
    expect(e.facilite).toBeCloseTo(2.3);
    expect(e.erreurs).toBe(1);
    expect(new Date(e.echeance).getTime() - maintenant.getTime()).toBe(10 * 60_000);
  });

  it('propose des intervalles croissants selon la note', () => {
    expect(apercuIntervalles(undefined, carte, maintenant)).toEqual({ 0: '10 min', 1: '1 j', 2: '1 j', 3: '3 j' });
    const e = noter(noter(noter(undefined, carte, 2, maintenant), carte, 2, maintenant), carte, 2, maintenant);
    const a = apercuIntervalles(e, carte, maintenant);
    expect(a[3]).toBe('26 j');
  });

  it('une carte échue plus tard dans la journée est déjà due', () => {
    const e = { echeance: new Date(2026, 10, 22, 20, 0).toISOString() } as EtatCarte;
    expect(estDue(e, maintenant)).toBe(true);
    expect(estDue({ echeance: new Date(2026, 10, 23, 1, 0).toISOString() } as EtatCarte, maintenant)).toBe(false);
  });
});

describe('composition des séances', () => {
  const oeuvres = ['a', 'b', 'c', 'd'].map((id) => oeuvre(id)).concat(oeuvre('sans-image', { imagePrincipaleId: undefined }));

  it('ne prend que des œuvres illustrées, une carte par œuvre, et limite les nouvelles', () => {
    const s = composerSeance(oeuvres, [], { maintenant, nouvelles: 2, maximum: 10, hasard });
    expect(s).toHaveLength(2);
    expect(s.every((c) => c.type === 'identifier')).toBe(true);
    expect(new Set(s.map((c) => c.oeuvreId)).size).toBe(2);
  });

  it('place les cartes dues avant les nouvelles et propose le QCM après une première identification', () => {
    const vue = noter(undefined, { oeuvreId: 'a', type: 'identifier' }, 2, new Date(2026, 10, 20));
    const s = composerSeance(oeuvres, [vue], { maintenant, nouvelles: 10, maximum: 10, hasard });
    expect(s.find((c) => c.oeuvreId === 'a')?.etat).toBeDefined();
    // L'œuvre « a » n'apparaît qu'une fois, même si son QCM est disponible.
    expect(s.filter((c) => c.oeuvreId === 'a')).toHaveLength(1);
    const s2 = composerSeance(oeuvres, [{ ...vue, echeance: new Date(2026, 11, 1).toISOString() }], { maintenant, nouvelles: 10, maximum: 10, hasard });
    expect(s2.some((c) => c.id === idCarte('a', 'periode'))).toBe(true);
  });

  it('ne propose pas le QCM le jour même de la première identification', () => {
    const aujourdhui = noter(undefined, { oeuvreId: 'a', type: 'identifier' }, 2, new Date(2026, 10, 22, 8, 0));
    const s = composerSeance(oeuvres, [aujourdhui], { maintenant, nouvelles: 10, maximum: 10, hasard });
    expect(s.some((c) => c.id === idCarte('a', 'periode'))).toBe(false);
  });

  it('filtre par aire', () => {
    const s = composerSeance([oeuvre('x', { aireId: 'cambodge', periodeId: 'angkor' }), oeuvre('y')], [], { maintenant, nouvelles: 10, maximum: 10, aireId: 'cambodge', hasard });
    expect(s.map((c) => c.oeuvreId)).toEqual(['x']);
  });

  it('fait le bilan du jour', () => {
    const vue = noter(undefined, { oeuvreId: 'a', type: 'identifier' }, 0, maintenant);
    expect(bilan(oeuvres, [vue], maintenant)).toEqual({ dues: 1, nouvelles: 3, maitrisees: 0, sansImage: 1 });
  });
});

describe('QCM de période', () => {
  it('propose la bonne période et trois leurres distincts, proches de préférence', () => {
    const o = optionsPeriode('angkor', hasard);
    expect(o).toHaveLength(4);
    expect(new Set(o).size).toBe(4);
    expect(o).toContain('angkor');
    expect(o.filter((id) => periodeParId(id)?.aireId === 'cambodge')).toContain('preangkorien');
  });
});

describe('variantes : site, musée, iconographie', () => {
  it('reconnaît une œuvre conservée dans un musée', async () => {
    const { museeDe } = await import('./revision');
    expect(museeDe('Musée Guimet, Paris (MG 14910)')).toBe('Musée Guimet, Paris');
    expect(museeDe('Indian Museum, Kolkata (balustrade et porte remontées) ; éléments au Musée national de New Delhi')).toBe('Indian Museum, Kolkata');
    expect(museeDe('Cleveland Museum of Art (inv. 1930.331)')).toBe('Cleveland Museum of Art');
    expect(museeDe('In situ ; patrimoine mondial de l’UNESCO')).toBeUndefined();
    expect(museeDe('Nombreux exemplaires ; référence classique : Government Museum, Chennai')).toBeUndefined();
    expect(museeDe('Feuillets dispersés : MAK (Vienne)')).toBeUndefined();
  });

  it('propose les variantes selon les informations de la fiche', async () => {
    const { cartesDe } = await import('./revision');
    expect(cartesDe(oeuvre('a', { site: 'Sarnath', conservation: 'Musée de Sarnath', iconographie: 'Bouddha' }))).toEqual(['identifier', 'periode', 'site', 'musee', 'iconographie']);
    expect(cartesDe(oeuvre('b', { site: 'Angkor', conservation: 'In situ' }))).toEqual(['identifier', 'periode', 'site']);
  });

  it('construit des QCM de site et de musée sans doublons', async () => {
    const { optionsMusee, optionsSite } = await import('./revision');
    const fiches = [
      oeuvre('a', { site: 'Sarnath', conservation: 'Musée de Sarnath' }),
      oeuvre('b', { site: 'Mathurā', conservation: 'Government Museum, Mathurā (inv. A-1)' }),
      oeuvre('c', { site: 'Mathurā', conservation: 'Government Museum, Mathurā (inv. 00-A-5)' }),
      oeuvre('d', { site: 'Angkor', aireId: 'cambodge', conservation: 'Musée Guimet, Paris' }),
    ];
    const sites = optionsSite(fiches[0], fiches, hasard);
    expect(sites).toContain('Sarnath');
    expect(new Set(sites).size).toBe(sites.length);
    expect(sites.length).toBe(3); // seulement trois sites distincts disponibles
    const musees = optionsMusee(fiches[0], fiches, hasard);
    expect(musees).toHaveLength(4);
    expect(musees).toContain('Musée de Sarnath');
    expect(new Set(musees).size).toBe(4);
  });

  it('propose les variantes à partir du lendemain, cinq au plus', () => {
    const fiches = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => oeuvre(id, { site: `site ${id}`, iconographie: 'x' }));
    const hier = new Date(2026, 10, 21);
    const etats = fiches.map((f) => ({ ...noter(undefined, { oeuvreId: f.id, type: 'identifier' }, 2, hier), echeance: new Date(2026, 11, 1).toISOString() }));
    const s = composerSeance(fiches, etats, { maintenant, nouvelles: 0, maximum: 30, hasard });
    expect(s).toHaveLength(5);
    expect(s.every((c) => ['periode', 'site', 'iconographie'].includes(c.type))).toBe(true);
  });
});

describe('quiz libre', () => {
  it('tire des QCM des types demandés, une question par sujet, sans dépasser le nombre', async () => {
    const { composerQuiz } = await import('./revision');
    const fiches = ['a', 'b', 'c'].map((id) => oeuvre(id, { site: `site ${id}`, conservation: 'Musée Guimet, Paris' })).concat(oeuvre('sans', { imagePrincipaleId: undefined }));
    const termes = [{ id: 'gl-1' }, { id: 'gl-2' }];
    const q = composerQuiz(fiches, termes, { types: ['periode', 'site', 'musee', 'definition'], nombre: 10, hasard });
    expect(q).toHaveLength(5);
    expect(new Set(q.map((c) => c.oeuvreId)).size).toBe(5);
    expect(q.some((c) => c.oeuvreId === 'sans')).toBe(false);
    expect(composerQuiz(fiches, termes, { types: ['musee'], nombre: 2, hasard }).every((c) => c.type === 'musee')).toBe(true);
    expect(composerQuiz(fiches, termes, { types: ['site'], nombre: 10, aireId: 'cambodge', hasard })).toEqual([]);
  });
});
