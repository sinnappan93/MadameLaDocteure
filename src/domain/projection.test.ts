import { describe, expect, it } from 'vitest';
import { PERIODES } from './catalogue';
import {
  ajouterInstantane,
  couvertureProgramme,
  instantane,
  memorisation,
  niveau,
  notesDesSujets,
  noteVersPreparation,
  pretPour,
  projeterCouverture,
  rythme,
  tendance,
} from './projection';
import type { EtatCarte } from './revision';
import { type Oeuvre, oeuvreVide } from './types';
import type { Copie } from './examen';
import type { Seance } from './plan';

const oeuvre = (id: string, periodeId: string, aireId: string): Oeuvre => ({ ...oeuvreVide(), id, titre: id, periodeId, aireId, creeeLe: '', modifieeLe: '' });
const etat = (oeuvreId: string, intervalle: number, c: Partial<EtatCarte> = {}): EtatCarte => ({
  id: `${oeuvreId}:identifier`,
  oeuvreId,
  type: 'identifier',
  repetitions: 3,
  intervalle,
  facilite: 2.5,
  echeance: '2027-01-01T00:00:00.000Z',
  derniereRevision: '2026-11-20T00:00:00.000Z',
  revisions: 4,
  erreurs: 1,
  ...c,
});

const p1 = PERIODES.find((p) => p.aireId === 'cambodge')!;
const p2 = PERIODES.filter((p) => p.aireId === 'cambodge')[1];

describe('couverture', () => {
  const oeuvres = [oeuvre('a', p1.id, 'cambodge'), oeuvre('b', p1.id, 'cambodge'), oeuvre('c', p2.id, 'cambodge')];
  const etats = [etat('a', 30), etat('b', 25), etat('c', 40)];
  const c = couvertureProgramme(oeuvres, etats);

  it('compte une période couverte à partir de 2 œuvres maîtrisées', () => {
    const k = c.aires.find((a) => a.aireId === 'cambodge')!;
    const total = PERIODES.filter((p) => p.aireId === 'cambodge').length;
    expect(k).toMatchObject({ total, couvertes: 1, enCours: 1, maitrisees: 3 });
    expect(k.manquantes).toBe(1 + 2 * (total - 2));
    expect(k.aCreer).toBe(1 + 2 * (total - 2));
    expect(c.couvertes).toBe(1);
    expect(c.total).toBe(PERIODES.length);
  });

  it('ne compte pas une œuvre en cours d’apprentissage', () => {
    expect(couvertureProgramme(oeuvres, [etat('a', 30), etat('b', 5)]).couvertes).toBe(0);
  });

  it('mesure la mémorisation', () => {
    const m = memorisation([...oeuvres, oeuvre('d', p2.id, 'cambodge')], [...etats, etat('gl-x', 30, { id: 'gl-x:terme', type: 'terme' })], { glossaire: 4, anglais: 10 });
    expect(m).toMatchObject({ total: 4, vues: 3, maitrisees: 3, glossaire: 0.25, anglais: 0 });
    expect(m.reussite).toBeCloseTo(0.75);
  });
});

describe('rythme de couverture', () => {
  const actuel = { date: '2026-11-30', maitrisees: { cambodge: 10, java: 4 }, manquantes: { cambodge: 20, java: 6 } };

  it('projette la date de couverture au rythme des 4 dernières semaines', () => {
    const historique = [{ date: '2026-11-16', maitrisees: { cambodge: 6, java: 4 }, manquantes: {} }];
    const p = projeterCouverture('l’Asie du Sud-Est', ['cambodge', 'java'], historique, actuel, '2026-11-30', '2027-07-01');
    // +4 œuvres en 14 jours : 26 manquantes → 91 jours.
    expect(p).toMatchObject({ etat: 'estime', date: '2027-03-01', avantEcrits: true });
    expect(p.parSemaine).toBeCloseTo(2);
  });

  it('signale l’absence de recul ou de progression', () => {
    expect(projeterCouverture('x', ['cambodge'], [{ ...actuel, date: '2026-11-27' }], actuel, '2026-11-30', '2027-07-01').etat).toBe('pas-de-recul');
    expect(projeterCouverture('x', ['java'], [{ date: '2026-11-20', maitrisees: { java: 4 }, manquantes: {} }], actuel, '2026-11-30', '2027-07-01').etat).toBe('stagne');
    expect(projeterCouverture('x', ['champa'], [], actuel, '2026-11-30', '2027-07-01').etat).toBe('couvert');
  });

  it('remplace la photo du jour', () => {
    const c = couvertureProgramme([], []);
    const h = ajouterInstantane(ajouterInstantane([], instantane(c, '2026-11-30')), { ...instantane(c, '2026-11-30'), maitrisees: { x: 1 } });
    expect(h).toHaveLength(1);
    expect(h[0].maitrisees).toEqual({ x: 1 });
  });
});

describe('notes et rythme', () => {
  const copie = (type: string, jour: string, n: number, correcteur?: number): Copie =>
    ({ id: `${type}${jour}`, type, sujet: 's', debut: `${jour}T10:00:00`, fin: `${jour}T14:00:00`, correction: { noteSur20: n }, noteCorrecteur: correcteur === undefined ? undefined : { note: correcteur } }) as never;

  it('retient la note du correcteur et calcule la tendance', () => {
    const notes = notesDesSujets([copie('specialite', '2026-10-01', 8), copie('specialite', '2026-10-08', 9), copie('specialite', '2026-10-15', 10), copie('specialite', '2026-10-22', 12, 13), copie('plan', '2026-10-23', 15), copie('culture', '2026-10-24', 11)]);
    expect(notes.map((x) => x.note)).toEqual([8, 9, 10, 13, 11]);
    expect(notes[3].source).toBe('correcteur');
    expect(tendance(notes, 'specialite')).toMatchObject({ nombre: 4, recente: (9 + 10 + 13) / 3 });
    expect(tendance(notes, 'specialite').evolution).toBeCloseTo((9 + 10 + 13) / 3 - 8);
    expect(tendance(notes, 'synthese').recente).toBeUndefined();
  });

  it('compare les heures faites au plan, semaine par semaine', () => {
    const s = (date: string, dureeMin: number, faite = false): Seance => ({ id: date + dureeMin, date, type: 'lecture', phase: 'fond', titre: '', description: '', dureeMin, faite });
    const r = rythme([s('2026-11-23', 30, true), s('2026-11-24', 60), s('2026-11-26', 45), s('2026-11-16', 20, true)], () => new Set(), '2026-11-25', 2);
    expect(r).toEqual([
      { lundi: '2026-11-16', prevues: 20, faites: 20 },
      { lundi: '2026-11-23', prevues: 90, faites: 30 },
    ]);
  });
});

describe('prêt pour l’écrit et l’oral', () => {
  it('traduit les notes en préparation et signale ce qui manque', () => {
    expect(noteVersPreparation(14)).toBe(1);
    expect(noteVersPreparation(10)).toBe(0.5);
    expect(noteVersPreparation(4)).toBe(0);
    expect(niveau(0.2)).toBe('À construire');
    expect(niveau(0.85)).toBe('Prêt');
    const b = pretPour({
      couverture: { periodes: [], aires: [], couvertes: 10, total: 20 },
      memo: { total: 40, vues: 30, maitrisees: 20, enRetard: 0, glossaire: 0.5, anglais: 0.3 },
      notes: [{ copieId: 'c', type: 'specialite', date: '2026-11-01', sujet: '', note: 10, source: 'ia' }],
      oraux: [],
    });
    const spe = b.ecrit.find((p) => p.id === 'specialite')!;
    expect(spe.score).toBeCloseTo((0.5 * 0.35 + 0.5 * 0.25 + 0.5 * 0.4) / 1);
    expect(spe.incomplet).toBe(false);
    expect(b.ecrit.find((p) => p.id === 'culture')!).toMatchObject({ incomplet: true, score: 0 });
    expect(b.oral[0].incomplet).toBe(true);
    expect(b.globalEcrit.score).toBeGreaterThan(0);
  });
});
