import { useEffect, useMemo, useRef, useState } from 'react';
import { AIRES, aireParId, formatAnnee, PERIODES, type Periode, periodeParId } from '../domain/catalogue';
import type { Oeuvre } from '../domain/types';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';

/** Bornes de la frise, en années (négatives avant J.-C.). */
const DEBUT = -2700;
const FIN = 2000;
/** Niveaux de zoom, en pixels par année. */
const ZOOMS = [0.12, 0.2, 0.35, 0.6, 1, 1.7, 3];
/** Hauteur d'une barre de période et d'un couloir de points d'œuvres. */
const BARRE = 20;
const POINT = 14;
const MARGE = 5;
const NB_COULOIRS_POINTS = 2;

/** Répartit les périodes d'une aire sur des couloirs, sans chevauchement (calcul en années : indépendant du zoom). */
function couloirsPeriodes(periodes: Periode[]): Map<string, number> {
  const fins: number[] = [];
  const r = new Map<string, number>();
  for (const p of [...periodes].sort((a, b) => a.debut - b.debut)) {
    let c = fins.findIndex((f) => p.debut >= f);
    if (c === -1) c = fins.length;
    fins[c] = p.fin;
    r.set(p.id, c);
  }
  return r;
}

const COULOIRS_PERIODES = new Map(AIRES.map((aire) => [aire.id, couloirsPeriodes(PERIODES.filter((p) => p.aireId === aire.id))]));

/**
 * Disposition verticale : pour chaque aire, couloirs des périodes, hauteur et position de la ligne.
 * La hauteur s'adapte au nombre de couloirs de points nécessaires au zoom courant.
 */
function disposition(couloirsPoints: Map<string, number>) {
  let haut = 28;
  return AIRES.map((aire) => {
    const couloirs = COULOIRS_PERIODES.get(aire.id)!;
    const nb = Math.max(1, ...[...couloirs.values()].map((c) => c + 1));
    const nbPoints = Math.max(NB_COULOIRS_POINTS, couloirsPoints.get(aire.id) ?? 0);
    const hauteur = MARGE + nb * (BARRE + 2) + nbPoints * POINT + MARGE + 2;
    const ligne = { aire, couloirs, haut, hauteur, hautPoints: MARGE + nb * (BARRE + 2) + 1 };
    haut += hauteur;
    return ligne;
  });
}
const RACCOURCIS: Array<[string, number, number]> = [
  ['Tout', DEBUT, FIN],
  ['Antiquité', -600, 600],
  ['Médiéval', 600, 1300],
  ['Moderne', 1300, 1950],
];

type Selection = { type: 'periode'; periode: Periode } | { type: 'oeuvre'; oeuvre: Oeuvre };

const milieu = (o: Oeuvre) => ((o.debut ?? o.fin)! + (o.fin ?? o.debut)!) / 2;

/** Répartit les points proches sur autant de couloirs que nécessaire pour qu'ils restent touchables ; renvoie le couloir de chaque œuvre. */
function couloirs(oeuvres: Oeuvre[], x: (a: number) => number): Map<string, number> {
  const fin: number[] = [];
  const resultat = new Map<string, number>();
  for (const o of [...oeuvres].sort((a, b) => milieu(a) - milieu(b))) {
    const position = x(milieu(o));
    let c = fin.findIndex((f) => position - f >= POINT + 2);
    if (c === -1) c = fin.length;
    fin[c] = position;
    resultat.set(o.id, c);
  }
  return resultat;
}

/** Pas des graduations : assez espacées pour rester lisibles. */
function pasGraduation(pxParAn: number): number {
  return [25, 50, 100, 200, 500, 1000].find((p) => p * pxParAn >= 64) ?? 1000;
}

/** Frise des périodes par aire, avec les œuvres des fiches ; défilement horizontal et zoom. */
export function Frise({ ouvrirFiche }: { ouvrirFiche: (id: string) => void }) {
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const [zoom, setZoom] = useState(2);
  const [selection, setSelection] = useState<Selection>();
  const defilement = useRef<HTMLDivElement>(null);
  const ancre = useRef<number>();
  const px = ZOOMS[zoom];
  const x = (annee: number) => (annee - DEBUT) * px;
  const largeur = (FIN - DEBUT) * px;

  const datees = useMemo(() => (oeuvres ?? []).filter((o) => o.debut !== undefined || o.fin !== undefined), [oeuvres]);
  const couloirsOeuvres = useMemo(() => new Map(AIRES.map((a) => [a.id, couloirs(datees.filter((o) => o.aireId === a.id), x)])), [datees, px]);
  const lignes = useMemo(() => disposition(new Map([...couloirsOeuvres].map(([id, c]) => [id, c.size ? Math.max(...c.values()) + 1 : 0]))), [couloirsOeuvres]);
  const hauteurTotale = lignes.reduce((t, l) => t + l.hauteur, 28);

  // Conserve l'année au centre de l'écran quand on zoome.
  const changerZoom = (nouveau: number) => {
    const el = defilement.current;
    if (el) ancre.current = DEBUT + (el.scrollLeft + el.clientWidth / 2) / px;
    setZoom(Math.max(0, Math.min(ZOOMS.length - 1, nouveau)));
  };
  useEffect(() => {
    const el = defilement.current;
    if (!el || ancre.current === undefined) return;
    el.scrollLeft = x(ancre.current) - el.clientWidth / 2;
    ancre.current = undefined;
  }, [zoom]);

  const allerA = (debut: number, fin: number) => {
    const el = defilement.current;
    if (!el) return;
    const ideal = el.clientWidth / (fin - debut);
    const niveau = ZOOMS.reduce((meilleur, z, i) => (z <= ideal * 1.15 ? i : meilleur), 0);
    ancre.current = (debut + fin) / 2;
    setZoom(niveau);
    if (niveau === zoom) {
      el.scrollLeft = (ancre.current - DEBUT) * ZOOMS[niveau] - el.clientWidth / 2;
      ancre.current = undefined;
    }
  };

  // Ouverture centrée sur notre ère.
  useEffect(() => {
    const el = defilement.current;
    if (el) el.scrollLeft = x(-400);
  }, []);

  const pas = pasGraduation(px);
  const graduations: number[] = [];
  for (let a = Math.ceil(DEBUT / pas) * pas; a <= FIN; a += pas) graduations.push(a);

  return (
    <section className="panneau frise-page">
      <div className="frise-outils">
        <div className="puces" role="group" aria-label="Époques">
          {RACCOURCIS.map(([nom, d, f]) => (
            <button key={nom} onClick={() => allerA(d, f)}>
              {nom}
            </button>
          ))}
        </div>
        <div className="frise-zoom">
          <button className="bouton-icone" onClick={() => changerZoom(zoom - 1)} disabled={zoom === 0} aria-label="Dézoomer">
            −
          </button>
          <button className="bouton-icone" onClick={() => changerZoom(zoom + 1)} disabled={zoom === ZOOMS.length - 1} aria-label="Zoomer">
            +
          </button>
        </div>
      </div>

      <div className="frise">
        <div className="frise-etiquettes" aria-hidden>
          <div className="frise-axe-vide" />
          {lignes.map(({ aire, hauteur }) => (
            <div key={aire.id} className="frise-etiquette" style={{ height: hauteur }}>
              {aire.nom}
            </div>
          ))}
        </div>
        <div className="frise-defilement" ref={defilement}>
          <div className="frise-contenu" style={{ width: largeur, height: hauteurTotale }}>
            <div className="frise-axe">
              {graduations.map((a) => (
                <span key={a} className="graduation" style={{ left: x(a) }}>
                  {a === 0 ? '0' : formatAnnee(a)}
                </span>
              ))}
            </div>
            {graduations.map((a) => (
              <span key={`l${a}`} className={`frise-repere ${a === 0 ? 'zero' : ''}`} style={{ left: x(a) }} />
            ))}
            {lignes.map(({ aire, couloirs: couloirsLigne, haut, hauteur, hautPoints }, i) => (
              <div key={aire.id} className="frise-ligne" style={{ top: haut, height: hauteur }} aria-label={aire.nom}>
                {PERIODES.filter((p) => p.aireId === aire.id).map((p) => (
                  <button
                    key={p.id}
                    className={`frise-periode t${i % 10} ${selection?.type === 'periode' && selection.periode.id === p.id ? 'choisie' : ''}`}
                    style={{ left: x(p.debut), width: Math.max(4, (p.fin - p.debut) * px), top: MARGE + (couloirsLigne.get(p.id) ?? 0) * (BARRE + 2), height: BARRE }}
                    title={`${p.nom} (${formatAnnee(p.debut)} – ${formatAnnee(p.fin)})`}
                    onClick={() => setSelection({ type: 'periode', periode: p })}
                  >
                    {(p.fin - p.debut) * px > 56 && <span>{p.nom}</span>}
                  </button>
                ))}
                {(() => {
                  const ici = datees.filter((o) => o.aireId === aire.id);
                  const c = couloirsOeuvres.get(aire.id)!;
                  return ici.map((o) => (
                    <button
                      key={o.id}
                      className={`frise-oeuvre ${selection?.type === 'oeuvre' && selection.oeuvre.id === o.id ? 'choisie' : ''}`}
                      style={{ left: x(milieu(o)) - POINT / 2, top: hautPoints + (c.get(o.id) ?? 0) * POINT }}
                      title={o.titre}
                      aria-label={o.titre}
                      onClick={() => setSelection({ type: 'oeuvre', oeuvre: o })}
                    />
                  ));
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="discret">Barres : périodes et dynasties. Points : œuvres de tes fiches. Fais défiler la frise de côté ; touche un élément pour le détail.</p>

      {selection?.type === 'periode' && (
        <DetailPeriode periode={selection.periode} oeuvres={(oeuvres ?? []).filter((o) => o.periodeId === selection.periode.id)} ouvrirFiche={ouvrirFiche} />
      )}
      {selection?.type === 'oeuvre' && (
        <div className="bloc detail-frise">
          <h3>Œuvre</h3>
          <p className="carte-revision-titre">{selection.oeuvre.titre}</p>
          <p className="discret">
            {[selection.oeuvre.datation, periodeParId(selection.oeuvre.periodeId)?.nom, aireParId(selection.oeuvre.aireId)?.nom].filter(Boolean).join(' · ')}
          </p>
          <button className="bouton principal" onClick={() => ouvrirFiche(selection.oeuvre.id)}>
            Ouvrir la fiche
          </button>
        </div>
      )}
    </section>
  );
}

function DetailPeriode({ periode: p, oeuvres, ouvrirFiche }: { periode: Periode; oeuvres: Oeuvre[]; ouvrirFiche: (id: string) => void }) {
  const contemporaines = PERIODES.filter((x) => x.aireId !== p.aireId && x.debut < p.fin && x.fin > p.debut);
  return (
    <div className="bloc detail-frise">
      <h3>Période</h3>
      <p className="carte-revision-titre">{p.nom}</p>
      <p className="discret">
        {aireParId(p.aireId)?.nom} · {formatAnnee(p.debut)} – {formatAnnee(p.fin)}
      </p>
      {oeuvres.length > 0 ? (
        <div className="exemples">
          {oeuvres.map((o) => (
            <button key={o.id} className="puce-fiche" onClick={() => ouvrirFiche(o.id)}>
              {o.titre}
            </button>
          ))}
        </div>
      ) : (
        <p className="discret">Aucune fiche pour cette période.</p>
      )}
      {contemporaines.length > 0 && <p className="discret contemporaines">Au même moment ailleurs : {contemporaines.map((x) => x.nom).join(', ')}.</p>}
    </div>
  );
}
