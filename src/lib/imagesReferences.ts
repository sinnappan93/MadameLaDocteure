/**
 * Télécharge sur l'appareil la photo choisie pour chaque fiche préparée (Wikimedia Commons),
 * avec ses crédits. Chaque fiche n'est traitée qu'une fois : une image retirée ne revient pas.
 * En cas d'échec réseau, la fiche sera retentée au prochain lancement.
 */
import { REFERENCES } from '../data/references';
import { lireInfosFichiers, urlInfosFichiers } from '../domain/commons';
import { ajouterImage, type Base, db } from './db';
import { telechargerImage } from './images';

const CLE = 'images-references-traitees';

export async function telechargerImagesReferences(base: Base = db, telecharger = telechargerImage): Promise<number> {
  const traitees = new Set(((await base.meta.get(CLE))?.valeur as string[] | undefined) ?? []);
  const aFaire: Array<{ id: string; fichier: string }> = [];
  for (const r of REFERENCES) {
    if (!r.imageCommons || traitees.has(r.id)) continue;
    const o = await base.oeuvres.get(r.id);
    const dejaIllustree = o && (await base.images.where('oeuvreId').equals(r.id).count()) > 0;
    if (!o || dejaIllustree) traitees.add(r.id);
    else aFaire.push({ id: r.id, fichier: r.imageCommons });
  }

  let ajoutees = 0;
  for (let i = 0; i < aFaire.length; i += 25) {
    const lot = aFaire.slice(i, i + 25);
    let infos: ReturnType<typeof lireInfosFichiers>;
    try {
      const r = await fetch(urlInfosFichiers(lot.map((l) => l.fichier)));
      if (!r.ok) break;
      infos = lireInfosFichiers(await r.json());
    } catch {
      break; // hors ligne : on réessaiera plus tard
    }
    // Trois téléchargements à la fois.
    for (let j = 0; j < lot.length; j += 3) {
      await Promise.all(
        lot.slice(j, j + 3).map(async ({ id, fichier }) => {
          const info = infos.get(fichier);
          if (!info) {
            traitees.add(id); // fichier disparu de Commons
            return;
          }
          try {
            const { blob, largeur, hauteur } = await telecharger(info.urlImport);
            if ((await base.images.where('oeuvreId').equals(id).count()) === 0 && (await base.oeuvres.get(id))) {
              await ajouterImage(id, blob, { source: 'commons', largeur, hauteur, titre: info.titre, auteur: info.auteur, licence: info.licence, urlOrigine: info.pageOrigine }, base);
              ajoutees++;
            }
            traitees.add(id);
          } catch {
            /* réessayé au prochain lancement */
          }
        }),
      );
    }
    await base.meta.put({ cle: CLE, valeur: [...traitees] });
  }
  await base.meta.put({ cle: CLE, valeur: [...traitees] });
  return ajoutees;
}
