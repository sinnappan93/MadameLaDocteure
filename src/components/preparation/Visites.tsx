import { useState } from 'react';
import { MUSEE_PAR_DEFAUT, SECTIONS_GUIMET } from '../../data/preparation';
import { AIRES, aireParId } from '../../domain/catalogue';
import { cleJour } from '../../domain/plan';
import { oeuvreVide } from '../../domain/types';
import { db, ficheDepuisPhoto, modifierVisite, supprimerVisite } from '../../lib/db';
import { reduireImage } from '../../lib/images';
import { useLive, useUrlFichier } from '../../lib/useLive';
import { TexteAuto } from '../oral/communs';
import { Vignette } from '../Vignette';
import { jourCourt, jourLong } from './communs';

export const nomSection = (id: string) => SECTIONS_GUIMET.find((s) => s.id === id)?.nom ?? id;

/** Journal des visites de musées, et visites prévues par le plan. */
export function Visites({ ouvrir, nouvelle }: { ouvrir: (id: string) => void; nouvelle: (sections?: string[], seanceId?: string) => void }) {
  const aujourdhui = cleJour(new Date());
  const visites = useLive(async () => (await db.visites.toArray()).sort((a, b) => b.date.localeCompare(a.date)), []);
  const prevues = useLive(async () => (await db.seances.where('date').aboveOrEqual(aujourdhui).toArray()).filter((s) => s.type === 'visite').slice(0, 3), [aujourdhui]);
  if (!visites || !prevues) return <section className="panneau" />;
  const fiches = visites.reduce((t, v) => t + v.oeuvreIds.length, 0);
  return (
    <section className="panneau visites">
      <p className="discret">
        Note chaque visite : salles vues, impressions, et les œuvres que tu photographies, transformées tout de suite en fiches (avec la photo du cartel).
      </p>
      <button className="bouton principal large grand" onClick={() => nouvelle()}>
        📷 Nouvelle visite aujourd’hui
      </button>

      {prevues.length > 0 && (
        <>
          <h2 className="titre-oral">Prévues dans ton plan</h2>
          {prevues.map((s) => (
            <div key={s.id} className="seance t-fond0">
              <span className="seance-texte">
                <span className="seance-titre">{s.titre}</span>
                <span className="seance-detail">{jourLong(s.date)}</span>
              </span>
              {s.date === aujourdhui && (
                <button className="bouton petit" onClick={() => nouvelle(s.sections, s.id)}>
                  Commencer
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {visites.length > 0 && (
        <>
          <h2 className="titre-oral">
            Journal · {visites.length} visite{visites.length > 1 ? 's' : ''}, {fiches} fiche{fiches > 1 ? 's' : ''} créée{fiches > 1 ? 's' : ''}
          </h2>
          <ul className="liste-sujets">
            {visites.map((v) => (
              <li key={v.id} className="sujet">
                <button className="copie-ligne" onClick={() => ouvrir(v.id)}>
                  <span className="carte-mot-categorie">
                    {jourCourt(v.date)} · {v.musee}
                  </span>
                  <span className="sujet-intitule">{v.salles.length ? v.salles.map(nomSection).join(', ') : 'Salles à noter'}</span>
                  <span className={`etat-copie ${v.oeuvreIds.length ? 'ok' : ''}`}>
                    {v.oeuvreIds.length} œuvre{v.oeuvreIds.length > 1 ? 's' : ''} photographiée{v.oeuvreIds.length > 1 ? 's' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Une visite : date, musée, salles vues, notes, photos d'œuvres transformées en fiches. */
export function VisiteDetail({ id, retour, ouvrirFiche }: { id: string; retour: () => void; ouvrirFiche: (id: string) => void }) {
  const v = useLive(() => db.visites.get(id), [id]);
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const [autre, setAutre] = useState('');
  const [photo, setPhoto] = useState<Blob>();
  if (!v || !oeuvres) return <section className="panneau" />;
  const creees = v.oeuvreIds.map((o) => oeuvres.find((x) => x.id === o)).filter((o) => !!o);
  const airesVues = new Set(v.salles.flatMap((s) => SECTIONS_GUIMET.find((x) => x.id === s)?.aires ?? []));
  const estGuimet = /guimet/i.test(v.musee);
  const aRevoir = estGuimet ? oeuvres.filter((o) => /guimet/i.test(o.conservation) && o.aireId && airesVues.has(o.aireId) && !v.oeuvreIds.includes(o.id)).slice(0, 12) : [];
  const basculer = (s: string) => modifierVisite(id, { salles: v.salles.includes(s) ? v.salles.filter((x) => x !== s) : [...v.salles, s] });

  return (
    <section className="panneau visites">
      <div className="formulaire">
        <div className="deux-colonnes">
          <label>
            Date
            <input type="date" value={v.date} onChange={(e) => e.target.value && modifierVisite(id, { date: e.target.value })} />
          </label>
          <label>
            Musée
            <input defaultValue={v.musee} onBlur={(e) => e.target.value.trim() && modifierVisite(id, { musee: e.target.value.trim() })} />
          </label>
        </div>
        <div>
          <span className="libelle">Salles vues</span>
          <div className="puces">
            {(estGuimet ? SECTIONS_GUIMET.map((s) => s.id) : []).concat(v.salles.filter((s) => !SECTIONS_GUIMET.some((x) => x.id === s))).map((s) => (
              <button key={s} type="button" aria-pressed={v.salles.includes(s)} className={v.salles.includes(s) ? 'actif' : ''} onClick={() => basculer(s)}>
                {nomSection(s)}
              </button>
            ))}
          </div>
          <div className="jalon-ajout">
            <input value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Autre salle (ex. : salle 12, galerie du Panthéon bouddhique)" aria-label="Autre salle" />
            <button
              type="button"
              className="bouton"
              disabled={!autre.trim()}
              onClick={() => {
                modifierVisite(id, { salles: [...v.salles, autre.trim()] });
                setAutre('');
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="bloc">
        <h3>Notes</h3>
        <TexteAuto rows={5} initial={v.notes} placeholder="Impressions, accrochage, cartels intéressants, questions à creuser…" enregistrer={(notes) => modifierVisite(id, { notes })} aria-label="Notes de visite" />
      </div>

      <div className="bloc">
        <h3>Œuvres photographiées ({creees.length})</h3>
        {creees.map((o) => (
          <button key={o!.id} className="oeuvre-liee-bouton" onClick={() => ouvrirFiche(o!.id)}>
            <Vignette imageId={o!.imagePrincipaleId} alt="" />
            <span>{o!.titre}</span>
          </button>
        ))}
        {photo ? (
          <FormulairePhoto
            photo={photo}
            musee={v.musee}
            aireProposee={[...airesVues][0]}
            annuler={() => setPhoto(undefined)}
            creer={async (donnees, cartel) => {
              await ficheDepuisPhoto(id, { ...donnees, etiquettes: ['visite'] }, photo, cartel);
              setPhoto(undefined);
            }}
          />
        ) : (
          <label className="bouton principal large depot-photo">
            📷 Photographier une œuvre
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) setPhoto((await reduireImage(f)).blob);
              }}
            />
          </label>
        )}
        <p className="discret">Chaque photo devient une fiche, que tu complètes ensuite (période, iconographie, points à retenir) et qui entre dans tes révisions.</p>
      </div>

      {aRevoir.length > 0 && (
        <details className="bloc">
          <summary>À revoir sur place : tes fiches du Guimet dans ces salles ({aRevoir.length})</summary>
          {aRevoir.map((o) => (
            <button key={o.id} className="oeuvre-liee-bouton" onClick={() => ouvrirFiche(o.id)}>
              <Vignette imageId={o.imagePrincipaleId} alt="" />
              <span>
                {o.titre}
                <span className="discret"> · {o.conservation}</span>
              </span>
            </button>
          ))}
        </details>
      )}

      <div className="actions">
        <button
          className="bouton danger"
          onClick={async () => {
            if (!confirm('Supprimer cette visite du journal ? Les fiches créées sont gardées.')) return;
            await supprimerVisite(id);
            retour();
          }}
        >
          Supprimer la visite
        </button>
      </div>
    </section>
  );
}

function FormulairePhoto({
  photo,
  musee,
  aireProposee,
  annuler,
  creer,
}: {
  photo: Blob;
  musee: string;
  aireProposee?: string;
  annuler: () => void;
  creer: (donnees: ReturnType<typeof oeuvreVide>, cartel?: Blob) => Promise<void>;
}) {
  const url = useUrlFichier(photo);
  const [cartel, setCartel] = useState<Blob>();
  const urlCartel = useUrlFichier(cartel);
  const [f, setF] = useState({ titre: '', datation: '', materiau: '', inventaire: '', aireId: aireProposee ?? '' });
  const [enCours, setEnCours] = useState(false);
  return (
    <form
      className="formulaire photo-fiche"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.titre.trim()) return;
        setEnCours(true);
        await creer(
          {
            ...oeuvreVide(),
            titre: f.titre.trim(),
            datation: f.datation.trim(),
            materiau: f.materiau.trim(),
            aireId: f.aireId || undefined,
            conservation: `${musee}${f.inventaire.trim() ? ` (${f.inventaire.trim()})` : ''}`,
          },
          cartel,
        );
        setEnCours(false);
      }}
    >
      <div className="apercus-photo">
        {url && <img src={url} alt="Photo de l’œuvre" />}
        {urlCartel ? (
          <img src={urlCartel} alt="Photo du cartel" />
        ) : (
          <label className="bouton petit depot-photo">
            + Photo du cartel
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={async (e) => {
                const c = e.target.files?.[0];
                e.target.value = '';
                if (c) setCartel((await reduireImage(c)).blob);
              }}
            />
          </label>
        )}
      </div>
      <label>
        Titre (d’après le cartel)
        <input required value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Buste de Bodhisattva" />
      </label>
      <div className="deux-colonnes">
        <label>
          Datation
          <input value={f.datation} onChange={(e) => setF({ ...f, datation: e.target.value })} placeholder="Ex. : XIIe s." />
        </label>
        <label>
          Matériau
          <input value={f.materiau} onChange={(e) => setF({ ...f, materiau: e.target.value })} placeholder="Ex. : grès" />
        </label>
      </div>
      <div className="deux-colonnes">
        <label>
          N° d’inventaire
          <input value={f.inventaire} onChange={(e) => setF({ ...f, inventaire: e.target.value })} placeholder="Ex. : MG 18891" />
        </label>
        <label>
          Aire
          <select value={f.aireId} onChange={(e) => setF({ ...f, aireId: e.target.value })}>
            <option value="">À classer</option>
            {AIRES.map((a) => (
              <option key={a.id} value={a.id}>
                {aireParId(a.id)?.nom}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="actions">
        <button type="button" className="bouton" onClick={annuler}>
          Annuler
        </button>
        <button type="submit" className="bouton principal" disabled={enCours || !f.titre.trim()}>
          {enCours ? 'Création…' : 'Créer la fiche'}
        </button>
      </div>
    </form>
  );
}

/** Ouvre une nouvelle visite (aujourd'hui, au Guimet par défaut). */
export const nouvelleVisite = (sections: string[] = [], seanceId?: string) => ({ date: cleJour(new Date()), musee: MUSEE_PAR_DEFAUT, salles: sections, seanceId });
