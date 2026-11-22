/** Chargement des données nécessaires au plan de révision (lacunes, lectures) et (re)génération. */
import { VOCABULAIRE } from '../data/anglais';
import { COMPARAISONS } from '../data/comparaisons';
import { GLOSSAIRE } from '../data/glossaire';
import { cleJour, type ContextePlan, type DemandePlan, genererPlan, type Lacunes, mesurerLacunes, regenererPlan } from '../domain/plan';
import { db, enregistrerPlan } from './db';

export async function mesurerLacunesActuelles(): Promise<Lacunes> {
  const [oeuvres, etats, copies, oraux] = await Promise.all([db.oeuvres.toArray(), db.revisions.toArray(), db.copies.toArray(), db.oraux.toArray()]);
  return mesurerLacunes({ oeuvres, etats, copies, oraux, totalGlossaire: GLOSSAIRE.length, totalAnglais: VOCABULAIRE.length, totalComparaisons: COMPARAISONS.length });
}

async function contexte(): Promise<ContextePlan> {
  const [lacunes, lectures, oeuvres] = await Promise.all([mesurerLacunesActuelles(), db.lectures.toArray(), db.oeuvres.toArray()]);
  const fichesParAire: Record<string, number> = {};
  for (const o of oeuvres) if (o.aireId) fichesParAire[o.aireId] = (fichesParAire[o.aireId] ?? 0) + 1;
  return { lacunes, lectures, fichesParAire };
}

/** Crée le plan, ou le recalcule à partir d'aujourd'hui en gardant le passé et les séances faites. */
export async function construirePlan(demande: DemandePlan): Promise<void> {
  const ctx = await contexte();
  const anciennes = await db.seances.toArray();
  const seances = anciennes.length ? regenererPlan(anciennes, demande, ctx, cleJour(new Date())) : genererPlan(demande, ctx);
  await enregistrerPlan(demande, seances);
}
