import { describe, expect, it } from 'vitest';
import { CATEGORIES_GLOSSAIRE, GLOSSAIRE } from '../data/glossaire';
import { REFERENCES } from '../data/references';
import { bilanGlossaire, chercherTermes, composerSeanceGlossaire, optionsTermes, termesDeFiche } from './glossaire';
import { idCarte, noter } from './revision';

const hasard = () => 0.3;
const maintenant = new Date(2026, 10, 22, 9);

describe('données du glossaire', () => {
  it('a des identifiants uniques, des catégories connues et des exemples qui renvoient à des fiches existantes', () => {
    expect(new Set(GLOSSAIRE.map((t) => t.id)).size).toBe(GLOSSAIRE.length);
    const categories = new Set(CATEGORIES_GLOSSAIRE.map((c) => c.id));
    const fiches = new Set(REFERENCES.map((r) => r.id));
    for (const t of GLOSSAIRE) {
      expect(t.id.startsWith('gl-'), t.id).toBe(true);
      expect(categories.has(t.categorie), t.id).toBe(true);
      expect(t.definition.length, t.id).toBeGreaterThan(20);
      for (const e of t.exemples ?? []) expect(fiches.has(e), `${t.id} → ${e}`).toBe(true);
    }
    // Chaque catégorie a assez de termes pour un QCM à quatre choix.
    for (const c of categories) expect(GLOSSAIRE.filter((t) => t.categorie === c).length, c).toBeGreaterThanOrEqual(4);
  });
});

describe('révision du glossaire', () => {
  it('commence par des cartes « terme » et limite les nouveautés', () => {
    const s = composerSeanceGlossaire(GLOSSAIRE, [], { maintenant, nouvelles: 10, maximum: 30, hasard });
    expect(s).toHaveLength(10);
    expect(s.every((c) => c.type === 'terme')).toBe(true);
  });

  it('propose le QCM le lendemain et filtre par catégorie', () => {
    const vu = noter(undefined, { oeuvreId: 'gl-abhaya', type: 'terme' }, 3, new Date(2026, 10, 20));
    const s = composerSeanceGlossaire(GLOSSAIRE, [vu], { maintenant, nouvelles: 0, maximum: 30, categorie: 'gestes', hasard });
    expect(s.map((c) => c.id)).toEqual([idCarte('gl-abhaya', 'definition')]);
  });

  it('fait le bilan', () => {
    const vu = noter(undefined, { oeuvreId: 'gl-vajra', type: 'terme' }, 0, maintenant);
    const b = bilanGlossaire(GLOSSAIRE, [vu], maintenant);
    expect(b).toEqual({ dues: 1, nouveaux: GLOSSAIRE.length - 1, maitrises: 0 });
  });

  it('construit un QCM de quatre termes de la même catégorie', () => {
    const o = optionsTermes('gl-bhumisparsha', hasard);
    expect(o).toHaveLength(4);
    expect(o).toContain('gl-bhumisparsha');
    expect(o.every((id) => GLOSSAIRE.find((t) => t.id === id)?.categorie === 'gestes')).toBe(true);
  });
});

describe('consultation', () => {
  it('cherche sans accents, termes d’abord', () => {
    const r = chercherTermes('bhumisparsa');
    expect(r[0].id).toBe('gl-bhumisparsha');
    expect(chercherTermes('cobra').map((t) => t.id)).toContain('gl-naga');
  });

  it('retrouve les termes illustrés par une fiche', () => {
    expect(termesDeFiche('ref-nataraja-chola').map((t) => t.id)).toEqual(expect.arrayContaining(['gl-nataraja', 'gl-damaru', 'gl-gaja-hasta']));
  });
});
