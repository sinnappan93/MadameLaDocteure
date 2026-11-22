import { describe, expect, it } from 'vitest';
import {
  activitesDuJour,
  ajouterJours,
  chargeSemaine,
  type ContextePlan,
  demandeParDefaut,
  ecartJours,
  estFaite,
  genererPlan,
  jourSemaine,
  type Lacunes,
  lundiDe,
  mesurerLacunes,
  phaseDu,
  regenererPlan,
} from './plan';
import { type Oeuvre, oeuvreVide } from './types';
import type { EtatCarte } from './revision';

const oeuvre = (id: string, aireId: string, periodeId?: string): Oeuvre => ({ ...oeuvreVide(), id, titre: id, aireId, periodeId, creeeLe: '', modifieeLe: '' });
const etat = (oeuvreId: string, type: EtatCarte['type'], c: Partial<EtatCarte> = {}): EtatCarte => ({
  id: `${oeuvreId}:${type}`,
  oeuvreId,
  type,
  repetitions: 1,
  intervalle: 1,
  facilite: 2.5,
  echeance: '2026-11-23T00:00:00.000Z',
  derniereRevision: '2026-11-22T10:00:00.000Z',
  revisions: 1,
  erreurs: 0,
  ...c,
});

const lacunesNeutres = (): Lacunes =>
  mesurerLacunes({ oeuvres: [oeuvre('a', 'cambodge', 'angkor-vat')], etats: [], copies: [], oraux: [], totalGlossaire: 10, totalAnglais: 10, totalComparaisons: 5 });

const ctx = (c: Partial<ContextePlan> = {}): ContextePlan => ({ lacunes: lacunesNeutres(), lectures: [], fichesParAire: { cambodge: 1 }, ...c });

describe('dates', () => {
  it('calcule jours de la semaine, lundis et écarts', () => {
    expect(jourSemaine('2026-11-23')).toBe(0); // lundi
    expect(jourSemaine('2026-11-22')).toBe(6); // dimanche
    expect(lundiDe('2026-11-22')).toBe('2026-11-16');
    expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01');
    expect(ecartJours('2026-11-22', '2027-07-01')).toBe(221);
  });
});

describe('lacunes', () => {
  it('classe les aires de la plus faible à la plus solide', () => {
    const oeuvres = [oeuvre('k1', 'cambodge', 'angkor-vat'), oeuvre('k2', 'cambodge', 'angkor-vat'), oeuvre('j1', 'java')];
    const etats = [etat('k1', 'identifier', { intervalle: 30 }), etat('k2', 'identifier', { intervalle: 25 })];
    const l = mesurerLacunes({ oeuvres, etats, copies: [], oraux: [], totalGlossaire: 10, totalAnglais: 10, totalComparaisons: 5 });
    const rang = (id: string) => l.aires.findIndex((a) => a.aireId === id);
    expect(l.aires.find((a) => a.aireId === 'champa')).toMatchObject({ score: 1, raison: 'aucune fiche' });
    expect(rang('java')).toBeLessThan(rang('cambodge'));
    expect(l.aires.find((a) => a.aireId === 'cambodge')!.score).toBeLessThan(0.5);
  });

  it('mesure glossaire, anglais et notes des copies', () => {
    const etats = [etat('gl-a', 'terme', { intervalle: 30 }), etat('gl-b', 'terme'), etat('en-a', 'terme', { intervalle: 30 })];
    const copies = [{ type: 'specialite', correction: { noteSur20: 8 } }, { type: 'specialite', correction: { noteSur20: 10 } }, { type: 'culture', correction: { noteSur20: 15 } }] as never[];
    const l = mesurerLacunes({ oeuvres: [], etats, copies, oraux: [], totalGlossaire: 2, totalAnglais: 4, totalComparaisons: 5 });
    expect(l.glossaire).toBeCloseTo(1 - (0.7 * 1 + 0.3 * 2) / 2);
    expect(l.anglais).toBeCloseTo(1 - 1 / 4);
    expect(l.epreuves.specialite).toBeCloseTo(5 / 8);
    expect(l.epreuves.culture).toBe(0);
    expect(l.epreuves.synthese).toBe(0.6);
    expect(l.constats.join(' ')).toContain('9,0/20');
  });
});

describe('phases et charge', () => {
  const d = demandeParDefaut('2027-07-01', '2026-11-23');

  it('découpe la préparation en phases', () => {
    expect(phaseDu('2027-01-10', d)).toBe('fond');
    expect(phaseDu('2027-06-10', d)).toBe('affutage');
    expect(phaseDu('2027-07-01', d)).toBe('ecrits');
    expect(phaseDu('2027-07-05', d)).toBe('pause');
    expect(phaseDu('2027-08-01', d)).toBe('pre-oral');
    expect(phaseDu(ajouterJours(d.dateAdmissibilite, 1), d)).toBe('oral');
    expect(phaseDu(d.dateOral, d)).toBeUndefined();
  });

  it('augmente la charge, allège une semaine sur quatre et à l’approche des écrits', () => {
    const c = (lundi: string) => chargeSemaine(lundi, d);
    expect(c('2026-11-23')).toBeCloseTo(0.75);
    expect(c('2026-12-14')).toBeLessThan(c('2026-12-07'));
    expect(c('2027-05-10')).toBeGreaterThan(c('2026-11-30'));
    expect(c('2027-06-28')).toBe(0.6);
  });
});

describe('génération', () => {
  const d = { ...demandeParDefaut('2027-07-01', '2026-11-23'), visitesToutesLes: 4 };
  const plan = genererPlan(d, ctx());

  it('respecte les jours et le temps disponibles', () => {
    const parJour = new Map<string, number>();
    for (const s of plan) if (s.type !== 'jalon') parJour.set(s.date, (parJour.get(s.date) ?? 0) + s.dureeMin);
    for (const [jour, minutes] of parJour) {
      expect(jourSemaine(jour)).not.toBe(6); // dimanche libre
      const long = jourSemaine(jour) === 5;
      expect(minutes).toBeLessThanOrEqual(long ? Math.max(d.minutesLongues, d.dureeSujetBlanc) : d.minutesCourtes);
    }
  });

  it('commence chaque jour de fond par la révision espacée et varie les séances', () => {
    const fond = plan.filter((s) => s.phase === 'fond' && s.type !== 'jalon');
    const types = new Set(fond.map((s) => s.type));
    for (const t of ['identifier', 'lecture', 'glossaire', 'sujet-blanc', 'visite'] as const) expect(types.has(t)).toBe(true);
    const lundi = fond.filter((s) => s.date === '2026-11-23');
    expect(lundi[0].type).toBe('identifier');
  });

  it('propose des visites au Guimet toutes les 4 semaines, sur les sections des aires faibles', () => {
    const visites = plan.filter((s) => s.type === 'visite');
    expect(visites.length).toBeGreaterThan(5);
    expect(ecartJours(visites[0].date, visites[1].date)).toBe(28);
    expect(visites[0].sections).toHaveLength(2);
  });

  it('fait des sujets blancs chaque semaine d’affûtage, puis du repos la veille des écrits', () => {
    const affutage = plan.filter((s) => s.phase === 'affutage');
    expect(affutage.filter((s) => s.type === 'sujet-blanc').length).toBeGreaterThanOrEqual(4);
    expect(affutage.filter((s) => s.type === 'lecture').every((s) => !s.lectureId && s.titre === 'Relire tes notes de lecture')).toBe(true);
    expect(plan.find((s) => s.date === '2027-06-30')?.type).toBe('repos');
    expect(plan.filter((s) => s.date >= '2027-06-27' && s.date < '2027-07-01').some((s) => s.type === 'sujet-blanc')).toBe(false);
  });

  it('bascule sur l’oral après l’admissibilité, avec des jalons', () => {
    const oral = plan.filter((s) => s.phase === 'oral' && s.type !== 'jalon');
    expect(oral.filter((s) => s.type === 'oral').length).toBeGreaterThanOrEqual(3);
    expect(oral.some((s) => s.type === 'sujet-blanc' || s.type === 'lecture')).toBe(false);
    expect(plan.filter((s) => s.type === 'jalon').map((s) => s.titre)).toEqual(['Écrits', 'Résultats d’admissibilité', 'Oraux']);
    expect(plan.some((s) => s.date >= d.dateOral && s.type !== 'jalon')).toBe(false);
  });

  it('ne propose pas de sujet blanc complet sans plage assez longue', () => {
    const court = genererPlan({ ...d, minutesLongues: 120 }, ctx());
    expect(court.some((s) => s.type === 'sujet-blanc')).toBe(false);
  });

  it('suit les lectures en cours', () => {
    const lecture = { id: 'l1', titre: 'Huntington', statut: 'en-cours', pageActuelle: 120, aires: [] } as never;
    const s = genererPlan(d, ctx({ lectures: [lecture] })).find((x) => x.type === 'lecture');
    expect(s).toMatchObject({ lectureId: 'l1' });
    expect(s!.description).toContain('p. 121');
  });

  it('ajoute les démarches comme jalons', () => {
    const p = genererPlan({ ...d, jalons: [{ id: 'j', date: '2027-01-15', nom: 'Clôture des inscriptions' }] }, ctx());
    expect(p.find((s) => s.date === '2027-01-15' && s.type === 'jalon')?.titre).toBe('Clôture des inscriptions');
  });
});

describe('régénération et suivi', () => {
  const d = demandeParDefaut('2027-07-01', '2026-11-23');

  it('garde le passé et ce qui est fait', () => {
    const plan = genererPlan(d, ctx());
    const faite = { ...plan.find((s) => s.date === '2026-12-01')!, faite: true };
    const avant = plan.map((s) => (s.id === faite.id ? faite : s));
    const nouveau = regenererPlan(avant, d, ctx(), '2026-12-01');
    expect(nouveau.filter((s) => s.date < '2026-12-01').map((s) => s.id)).toEqual(avant.filter((s) => s.date < '2026-12-01').map((s) => s.id));
    expect(nouveau.find((s) => s.id === faite.id)?.faite).toBe(true);
    expect(nouveau.filter((s) => s.date === '2026-12-01' && s.type === faite.type)).toHaveLength(1);
  });

  it('reconnaît l’activité du jour', () => {
    const etats = ['a', 'b', 'c', 'd', 'e'].map((x) => etat(x, 'identifier'));
    const a = activitesDuJour('2026-11-22', { etats, copies: [], oraux: [], visites: [{ date: '2026-11-22' } as never], lectures: [] });
    expect([...a].sort()).toEqual(['identifier', 'visite']);
    expect(estFaite({ type: 'identifier' } as never, a)).toBe(true);
    expect(estFaite({ type: 'glossaire' } as never, a)).toBe(false);
  });
});
