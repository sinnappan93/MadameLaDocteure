import { describe, expect, it } from 'vitest';
import { PERIODES } from './catalogue';
import { completude, couverture, joursAvant } from './progression';
import { type Oeuvre, oeuvreVide } from './types';

const oeuvre = (extra: Partial<Oeuvre>): Oeuvre => ({ ...oeuvreVide(), id: 'x', titre: 'T', creeeLe: '', modifieeLe: '', ...extra });

describe('progression', () => {
  it('mesure la complétude d’une fiche', () => {
    expect(completude(oeuvre({}))).toBe(0);
    expect(completude(oeuvre({ datation: 'Ve s.', periodeId: 'gupta', imagePrincipaleId: 'i' }))).toBeCloseTo(0.3);
    expect(completude(oeuvre({ site: '   ' }))).toBe(0);
  });

  it('mesure la couverture des périodes d’une aire', () => {
    const cambodge = PERIODES.filter((p) => p.aireId === 'cambodge').length;
    expect(couverture([oeuvre({ periodeId: 'angkor' }), oeuvre({ periodeId: 'angkor' })], 'cambodge')).toEqual({ couvertes: 1, total: cambodge });
    expect(couverture([], undefined).total).toBe(PERIODES.length);
  });

  it('compte les jours avant les écrits', () => {
    expect(joursAvant('2027-07-01', new Date(2026, 10, 21, 22))).toBe(222);
    expect(joursAvant('2020-01-01', new Date(2026, 10, 21))).toBe(0);
  });
});
