import { describe, expect, it } from 'vitest';
import { periodeParId } from './catalogue';
import { bornesSiecle, distanceKm, enonceDynastie, nomSiecle, optionsDynastie, questionsDynastie, recouvrement, siteCourt } from './reperes';
import { composerQuiz } from './revision';
import { type Oeuvre, oeuvreVide } from './types';

describe('siècles', () => {
  it('calcule les bornes et les noms', () => {
    expect(bornesSiecle(9)).toEqual([801, 900]);
    expect(bornesSiecle(-3)).toEqual([-300, -201]);
    expect(nomSiecle(1)).toBe('Ier siècle');
    expect(nomSiecle(9)).toBe('IXe siècle');
    expect(nomSiecle(-3)).toBe('IIIe siècle av. J.-C.');
  });
});

describe('questions de dynasties', () => {
  const questions = questionsDynastie();
  it('pose « quelle période au Xe siècle au Cambodge ? » avec Angkorien pour réponse', () => {
    const q = questions.find((x) => x.id === 'rp-cambodge-10');
    expect(q?.periodeId).toBe('angkor');
    expect(enonceDynastie(q!)).toBe('Quelle période au Xe siècle au Cambodge ?');
  });

  it('a des identifiants uniques et des réponses qui couvrent l’essentiel du siècle', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const q of questions) {
      const p = periodeParId(q.periodeId);
      expect(p, q.id).toBeDefined();
      expect(p!.aireId, q.id).toBe(q.aireId);
      expect(recouvrement(p!, bornesSiecle(q.siecle)), q.id).toBeGreaterThanOrEqual(60);
    }
    // Pas de question piège sur l'Inde du Nord aux IXe–XIIe siècles (Pratīhāra absents du catalogue).
    expect(questions.some((q) => q.id === 'rp-inde-nord-9')).toBe(false);
  });

  it('propose quatre périodes distinctes dont la bonne, sans autre bonne réponse possible', () => {
    for (const q of questions) {
      const o = optionsDynastie(q, () => 0.3);
      expect(o, q.id).toHaveLength(4);
      expect(new Set(o).size, q.id).toBe(4);
      expect(o, q.id).toContain(q.periodeId);
      for (const id of o.filter((x) => x !== q.periodeId)) {
        const p = periodeParId(id)!;
        expect(p.aireId === q.aireId && recouvrement(p, bornesSiecle(q.siecle)) > 25, `${q.id} : ${id}`).toBe(false);
      }
    }
  });
});

describe('carte', () => {
  it('mesure les distances', () => {
    // Ellora – Ajanta : une centaine de kilomètres.
    expect(Math.round(distanceKm([20.024, 75.179], [20.552, 75.703]))).toBeGreaterThan(70);
    expect(Math.round(distanceKm([20.024, 75.179], [20.552, 75.703]))).toBeLessThan(90);
  });

  it('raccourcit les noms de sites', () => {
    expect(siteCourt('Mohenjo-daro (Sind, Pakistan)')).toBe('Mohenjo-daro');
    expect(siteCourt('Angkor Thom (Cambodge)')).toBe('Angkor Thom');
  });

  it('ajoute des questions de carte et de dynastie au quiz', () => {
    const fiche: Oeuvre = { ...oeuvreVide(), id: 'x', titre: 'x', lat: 20, lng: 75, aireId: 'inde-sud', creeeLe: '', modifieeLe: '' };
    const q = composerQuiz([fiche], [], { types: ['carte', 'dynastie'], nombre: 100, hasard: () => 0.5 });
    expect(q.some((c) => c.type === 'carte' && c.oeuvreId === 'x')).toBe(true);
    expect(q.some((c) => c.type === 'dynastie')).toBe(true);
  });
});
