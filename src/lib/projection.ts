/** Photo quotidienne de la progression (pour le rythme de couverture), gardée sur l'appareil. */
import { cleJour } from '../domain/plan';
import { ajouterInstantane, couvertureProgramme, type Instantane, instantane } from '../domain/projection';
import { db } from './db';

const CLE = 'instantanes';

export async function lireInstantanes(): Promise<Instantane[]> {
  return ((await db.meta.get(CLE))?.valeur as Instantane[] | undefined) ?? [];
}

/** Enregistre (ou met à jour) la photo du jour. */
export async function enregistrerInstantane(): Promise<void> {
  const [oeuvres, etats] = await Promise.all([db.oeuvres.toArray(), db.revisions.toArray()]);
  const i = instantane(couvertureProgramme(oeuvres, etats), cleJour(new Date()));
  await db.transaction('rw', db.meta, async () => {
    const h = ((await db.meta.get(CLE))?.valeur as Instantane[] | undefined) ?? [];
    await db.meta.put({ cle: CLE, valeur: ajouterInstantane(h, i) });
  });
}
