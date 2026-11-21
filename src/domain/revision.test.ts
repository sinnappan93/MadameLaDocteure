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
