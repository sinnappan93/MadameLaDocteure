import { describe, expect, it } from 'vitest';
import { THEMES_ORAL } from '../data/oral';
import {
  creerDossier,
  decrireDossier,
  lireBilanOral,
  lireQuestionsJury,
  minutage,
  motsDuTheme,
  oeuvresDuTheme,
  type Oral,
  questionsDeBanque,
  texteDisponible,
  tirerOeuvres,
} from './oral';
import { type Oeuvre, oeuvreVide } from './types';

const oeuvre = (id: string, c: Partial<Oeuvre> = {}): Oeuvre => ({ ...oeuvreVide(), id, titre: id, creeeLe: '', modifieeLe: '', imagePrincipaleId: `img-${id}`, ...c });

/** Générateur pseudo-aléatoire reproductible. */
const graine = (n = 1) => () => {
  n = (n * 16807) % 2147483647;
  return n / 2147483647;
};

describe('tirage du dossier', () => {
  const fiches = [
    oeuvre('a1', { aireId: 'cambodge', periodeId: 'p1' }),
    oeuvre('a2', { aireId: 'cambodge', periodeId: 'p1' }),
    oeuvre('a3', { aireId: 'cambodge', periodeId: 'p2' }),
    oeuvre('a4', { aireId: 'cambodge', periodeId: 'p3' }),
    oeuvre('b1', { aireId: 'java', periodeId: 'p9' }),
    oeuvre('sans', { aireId: 'cambodge', periodeId: 'p4', imagePrincipaleId: undefined }),
  ];

  it('tire des œuvres distinctes de la même aire, de périodes variées', () => {
    for (let s = 1; s < 20; s++) {
      const d = tirerOeuvres(fiches, { nombre: 3, aireId: 'cambodge', hasard: graine(s) });
      expect(d).toHaveLength(3);
      expect(new Set(d.map((o) => o.id)).size).toBe(3);
      expect(d.every((o) => o.aireId === 'cambodge' && o.imagePrincipaleId)).toBe(true);
      expect(new Set(d.map((o) => o.periodeId)).size).toBe(3);
    }
  });

  it('préfère des œuvres d’époques proches', () => {
    const datees = [oeuvre('ancienne', { aireId: 'inde', periodeId: 'kushan', debut: 100 }), oeuvre('proche', { aireId: 'inde', periodeId: 'gupta', debut: 450 }), oeuvre('moderne', { aireId: 'inde', periodeId: 'raj', debut: 1880 })];
    for (let s = 1; s < 10; s++) {
      const d = tirerOeuvres(datees, { nombre: 2, hasard: graine(s) }).map((o) => o.id);
      if (d[0] !== 'moderne') expect(d).not.toContain('moderne');
    }
  });

  it('complète avec d’autres aires si nécessaire', () => {
    const d = tirerOeuvres(fiches.slice(3, 5), { nombre: 2, hasard: graine(3) });
    expect(d.map((o) => o.id).sort()).toEqual(['a4', 'b1']);
  });

  it('renvoie une liste vide sans fiche', () => {
    expect(tirerOeuvres([], { nombre: 3 })).toEqual([]);
    expect(tirerOeuvres(fiches, { aireId: 'champa' })).toEqual([]);
  });

  it('copie les informations au moment du tirage et rédige la consigne', () => {
    const d = creerDossier('oeuvres', [fiches[0], fiches[2]], true);
    expect(d.documents[0]).toMatchObject({ oeuvreId: 'a1', imageId: 'img-a1', titre: 'a1' });
    expect(d.consigne).toContain('2 œuvres');
    expect(decrireDossier(d)).toContain('cartels étaient masqués');
  });
});

describe('thèmes', () => {
  const fiches = [
    oeuvre('Linteau de Banteay Srei', { iconographie: 'Indra sur Airāvata', etiquettes: ['khmer'] }),
    oeuvre('Bodhisattva', { site: 'Gandhāra', etiquettes: [] }),
    oeuvre('Tête du Bayon', { style: 'Bayon', conservation: 'Musée Guimet' }),
  ];

  it('rattache les fiches au thème, sans tenir compte des accents', () => {
    const angkor = THEMES_ORAL.find((t) => t.id === 'th-angkor')!;
    expect(oeuvresDuTheme(fiches, angkor.motsCles).map((o) => o.titre).sort()).toEqual(['Linteau de Banteay Srei', 'Tête du Bayon']);
    expect(oeuvresDuTheme(fiches, ['gandhara']).map((o) => o.titre)).toEqual(['Bodhisattva']);
  });

  it('extrait les mots significatifs d’un thème libre', () => {
    expect(motsDuTheme('Le nāga dans l’art khmer')).toEqual(['naga', 'khmer']);
  });
});

const oral = (c: Partial<Oral> = {}): Oral => ({
  id: 'o',
  dossier: creerDossier('oeuvres', [oeuvre('x'), oeuvre('y'), oeuvre('z')], false),
  dureePrepMin: 30,
  dureeEpreuveMin: 30,
  dureeExposeMin: 10,
  phase: 'preparation',
  debut: '2026-11-22T10:00:00.000Z',
  notes: '',
  exposeTexte: '',
  questions: [],
  modifieLe: '',
  ...c,
});

describe('minutage', () => {
  it('chronomètre la préparation, puis l’épreuve et l’exposé', () => {
    expect(minutage(oral())).toMatchObject({ debut: '2026-11-22T10:00:00.000Z', dureeMin: 30 });
    const m = minutage(oral({ phase: 'expose', debutEpreuve: '2026-11-22T10:31:00.000Z' }), Date.parse('2026-11-22T10:39:00.000Z'));
    expect(m).toMatchObject({ debut: '2026-11-22T10:31:00.000Z', dureeMin: 30, exposeRestantSec: 120 });
    expect(minutage(oral({ phase: 'questions', debutEpreuve: '2026-11-22T10:31:00.000Z' })).exposeRestantSec).toBeUndefined();
  });
});

describe('questions du jury', () => {
  it('compose une série hors ligne : relances, motivation, mises en situation', () => {
    const q = questionsDeBanque(oral().dossier, graine(5));
    expect(q.filter((x) => x.categorie === 'relance')).toHaveLength(4);
    expect(q.filter((x) => x.categorie === 'motivation')).toHaveLength(1);
    expect(q.filter((x) => x.categorie === 'situation')).toHaveLength(3);
    expect(new Set(q.map((x) => x.id)).size).toBe(q.length);
    expect(q.every((x) => x.attendu)).toBe(true);
  });

  it('ne nomme pas les œuvres quand les cartels sont masqués', () => {
    const d = creerDossier('oeuvres', [oeuvre('Secret')], true);
    expect(questionsDeBanque(d, graine(2)).some((x) => x.question.includes('Secret'))).toBe(false);
  });

  it('pose des relances sur le thème quand le dossier n’a pas d’œuvre', () => {
    const d = creerDossier('theme', [], false, 'Le nāga');
    const relances = questionsDeBanque(d, graine(2)).filter((x) => x.categorie === 'relance');
    expect(relances.some((x) => x.question.includes('Le nāga'))).toBe(true);
  });

  it('lit les questions de l’IA dans l’ordre et refuse une réponse trop maigre', () => {
    const q = lireQuestionsJury({
      relances: [{ question: 'Pourquoi cette datation ?', attendu: 'Critères' }, { question: '' }],
      motivation: [{ question: 'Pourquoi ce métier ?', attendu: 'Projet' }],
      situations: [{ question: 'Un prêt vous est demandé : que faites-vous ?', attendu: 'Constat d’état' }],
    });
    expect(q.map((x) => x.categorie)).toEqual(['relance', 'motivation', 'situation']);
    expect(() => lireQuestionsJury({ relances: [{ question: 'Une seule question ?' }] })).toThrow();
  });
});

describe('bilan', () => {
  it('borne la note et garde les commentaires utiles', () => {
    const b = lireBilanOral({ appreciation: ' Bien. ', note_sur_20: 23, points_forts: ['Clair', ''], par_question: [{ question: 'Q', commentaire: 'C' }, { question: 'R' }] });
    expect(b).toMatchObject({ appreciation: 'Bien.', noteSur20: 20, pointsForts: ['Clair'], parQuestion: [{ question: 'Q', commentaire: 'C' }] });
    expect(() => lireBilanOral({ note_sur_20: 12 })).toThrow();
  });

  it('demande de l’écrit : l’IA n’écoute pas l’audio', () => {
    expect(texteDisponible(oral({ exposeAudio: 'f' }))).toBe(false);
    expect(texteDisponible(oral({ exposeTexte: 'Mon exposé' }))).toBe(true);
    expect(texteDisponible(oral({ questions: [{ id: 'q', categorie: 'situation', question: 'Q', attendu: '', texte: 'Réponse' }] }))).toBe(true);
  });
});
