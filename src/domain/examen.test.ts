import { describe, expect, it } from 'vitest';
import { compterMots, formatChrono, formatDuree, lireCommentairePlan, lireCorrection, lireSujetsGeneres, secondesRestantes, sujetsProposes, tirerSujet } from './examen';

describe('chronomètre', () => {
  it('calcule le temps restant à partir du début enregistré', () => {
    const debut = new Date(2026, 10, 22, 9, 0).toISOString();
    expect(secondesRestantes(debut, 240, new Date(2026, 10, 22, 12, 30).getTime())).toBe(30 * 60);
    expect(secondesRestantes(debut, 240, new Date(2026, 10, 22, 13, 5).getTime())).toBe(-5 * 60);
  });

  it('affiche les durées', () => {
    expect(formatChrono(3 * 3600 + 5 * 60 + 9)).toBe('3:05:09');
    expect(formatChrono(14 * 60)).toBe('14:00');
    expect(formatChrono(-75)).toBe('−01:15');
    expect(formatDuree(240)).toBe('4 h');
    expect(formatDuree(15)).toBe('15 min');
  });

  it('compte les mots, apostrophes et accents compris', () => {
    expect(compterMots('L’image du Bouddha, à l’époque gupta.')).toBe(6);
  });
});

describe('sujets', () => {
  it('tire un sujet du bon type, nouveau de préférence', () => {
    const sujets = sujetsProposes();
    const s = tirerSujet(sujets, 'culture', [], () => 0);
    expect(s?.type).toBe('culture');
    const autre = tirerSujet(sujets, 'culture', [s!.id], () => 0);
    expect(autre?.id).not.toBe(s!.id);
  });

  it('lit les sujets générés en écartant vides et doublons', () => {
    expect(lireSujetsGeneres({ sujets: ['Le stūpa.', ' le stūpa. ', '', 'Les dynasties pāla.'] })).toEqual(['Le stūpa.', 'Les dynasties pāla.']);
    expect(lireSujetsGeneres(null)).toEqual([]);
  });
});

describe('réponses de l’IA', () => {
  it('lit une correction en bornant les notes', () => {
    const c = lireCorrection({
      criteres: [
        { critere: 'Problématique', note: 4.3, commentaire: 'Claire.' },
        { critere: 'Structure', note: 9, commentaire: 'Très bonne.' },
      ],
      note_sur_20: 13.7,
      appreciation: 'Bonne copie.',
      points_forts: ['Exemples précis', ''],
      a_ameliorer: ['Transitions'],
      conseils: [],
    });
    expect(c.criteres.map((x) => x.note)).toEqual([4.5, 5]);
    expect(c.noteSur20).toBe(13.5);
    expect(c.pointsForts).toEqual(['Exemples précis']);
  });

  it('refuse une correction sans critère', () => {
    expect(() => lireCorrection({ criteres: [], note_sur_20: 12 })).toThrow();
  });

  it('lit un commentaire de plan', () => {
    const p = lireCommentairePlan({
      appreciation: 'Plan solide.',
      problematique: 'À préciser.',
      plan: 'Équilibré.',
      points_forts: ['x'],
      a_ameliorer: ['y'],
      plan_propose: { problematique: 'Comment… ?', parties: [{ titre: 'I. Naissance', sous_parties: ['A', 'B'] }, { titre: '', sous_parties: [] }] },
    });
    expect(p.planPropose.parties).toHaveLength(1);
    expect(p.planPropose.parties[0].sousParties).toEqual(['A', 'B']);
  });
});
