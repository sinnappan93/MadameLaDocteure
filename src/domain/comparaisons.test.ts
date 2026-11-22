import { describe, expect, it } from 'vitest';
import { COMPARAISONS } from '../data/comparaisons';
import { REFERENCES } from '../data/references';
import { comparaisonsDe, comparaisonsDisponibles, composerSeanceComparaisons } from './comparaisons';
import { type Oeuvre, oeuvreVide } from './types';

const fiche = (id: string, image = true): Oeuvre => ({ ...oeuvreVide(), id, titre: id, imagePrincipaleId: image ? `img-${id}` : undefined, creeeLe: '', modifieeLe: '' });

describe('comparaisons', () => {
  it('renvoient à des fiches préparées existantes, avec des critères complets', () => {
    const ids = new Set(REFERENCES.map((r) => r.id));
    expect(new Set(COMPARAISONS.map((c) => c.id)).size).toBe(COMPARAISONS.length);
    for (const c of COMPARAISONS) {
      expect(ids.has(c.a) && ids.has(c.b), c.id).toBe(true);
      expect(c.a).not.toBe(c.b);
      expect(c.criteres.length, c.id).toBeGreaterThanOrEqual(3);
      for (const k of c.criteres) expect(k.critere && k.a && k.b, `${c.id} ${k.critere}`).toBeTruthy();
    }
  });

  it('ne retiennent que les paires dont les deux œuvres sont illustrées', () => {
    const fiches = [fiche('ref-angkor-vat'), fiche('ref-bayon'), fiche('ref-deogarh'), fiche('ref-vishnu-mebon', false)];
    expect(comparaisonsDisponibles(fiches).map((c) => c.id)).toEqual(['cmp-angkorvat-bayon']);
    const s = composerSeanceComparaisons(fiches, [], { maintenant: new Date(), nouvelles: 5, maximum: 10, hasard: () => 0.5 });
    expect(s.map((c) => c.id)).toEqual(['cmp-angkorvat-bayon:comparaison']);
  });

  it('retrouvent les comparaisons d’une fiche', () => {
    expect(comparaisonsDe('ref-bayon').map((x) => x.autre)).toEqual(['ref-angkor-vat']);
  });
});
