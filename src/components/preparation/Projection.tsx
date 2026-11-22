import { useEffect, useMemo, useState } from 'react';
import { VOCABULAIRE } from '../../data/anglais';
import { GLOSSAIRE } from '../../data/glossaire';
import { type TypeEpreuve, TYPES_EPREUVE } from '../../data/sujets';
import { aireParId } from '../../domain/catalogue';
import { formatDuree } from '../../domain/examen';
import { cleJour } from '../../domain/plan';
import {
  couvertureProgramme,
  GROUPES,
  instantane,
  memorisation,
  type NoteSujet,
  notesDesSujets,
  type Preparation,
  pretPour,
  type ProjectionCouverture,
  projectionPossibleLe,
  projeterCouverture,
  rythme,
  SEUIL_OEUVRES_PERIODE,
  tendance,
} from '../../domain/projection';
import { creerCopie, db, lireDemandePlan } from '../../lib/db';
import { enregistrerInstantane, lireInstantanes } from '../../lib/projection';
import type { Reglages } from '../../lib/reglages';
import { useLive } from '../../lib/useLive';
import { ChoixType } from '../examen/communs';
import { jourCourt, useActivites } from './communs';

const pct = (x: number) => `${Math.round(x * 100)} %`;
const virgule = (n: number, d = 1) => n.toFixed(d).replace('.', ',').replace(/,0$/, '');
const dateLongue = (jour: string) => new Date(`${jour}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ');

/** Projection : prêt pour l'écrit et l'oral, couverture, mémorisation, notes, rythme. */
export function Projection({ reglages, ouvrirCopie, ouvrirPlan }: { reglages: Reglages; ouvrirCopie: (id: string) => void; ouvrirPlan: () => void }) {
  const aujourdhui = cleJour(new Date());
  useEffect(() => {
    enregistrerInstantane().catch(console.error);
  }, []);
  const d = useLive(async () => {
    const [oeuvres, etats, copies, oraux, seances, demande, historique] = await Promise.all([
      db.oeuvres.toArray(),
      db.revisions.toArray(),
      db.copies.toArray(),
      db.oraux.toArray(),
      db.seances.toArray(),
      lireDemandePlan(),
      lireInstantanes(),
    ]);
    return { oeuvres, etats, copies, oraux, seances, demande, historique };
  }, []);
  const activites = useActivites();
  const calculs = useMemo(() => {
    if (!d) return undefined;
    const couverture = couvertureProgramme(d.oeuvres, d.etats);
    const memo = memorisation(d.oeuvres, d.etats, { glossaire: GLOSSAIRE.length, anglais: VOCABULAIRE.length });
    const notes = notesDesSujets(d.copies);
    const bilans = pretPour({ couverture, memo, notes, oraux: d.oraux });
    const dateEcrits = d.demande?.dateEcrits ?? reglages.dateEcrits;
    const actuel = instantane(couverture, aujourdhui);
    const projections = GROUPES.map((g) => projeterCouverture(g.nom, g.aires, d.historique, actuel, aujourdhui, dateEcrits));
    return { couverture, memo, notes, bilans, dateEcrits, projections };
  }, [d, reglages.dateEcrits, aujourdhui]);
  if (!d || !calculs) return <section className="panneau" />;
  const { couverture, memo, notes, bilans, dateEcrits, projections } = calculs;
  const semaines = activites && d.seances.length ? rythme(d.seances, activites, aujourdhui) : [];
  const prevuesTotal = semaines.reduce((t, s) => t + s.prevues, 0);
  const faitesTotal = semaines.reduce((t, s) => t + s.faites, 0);

  return (
    <section className="panneau projection">
      <p className="avertissement-projection">
        Ces indicateurs sont des <strong>repères</strong> calculés à partir de ce que l’appli mesure. Ce ne sont pas des notes garanties.
      </p>

      <div className="tuiles-pret">
        <TuilePret p={bilans.globalEcrit} />
        <TuilePret p={bilans.globalOral} />
      </div>

      <h2 className="titre-oral">Par épreuve</h2>
      <h3 className="sous-titre-projection">Écrit</h3>
      {bilans.ecrit.map((p) => (
        <LignePret key={p.id} p={p} />
      ))}
      <h3 className="sous-titre-projection">Oral</h3>
      {bilans.oral.map((p) => (
        <LignePret key={p.id} p={p} />
      ))}

      <h2 className="titre-oral">Couverture du programme</h2>
      <p className="discret">
        Une période est couverte quand au moins {SEUIL_OEUVRES_PERIODE} de ses œuvres sont maîtrisées (révisées avec succès sur plus de 3 semaines).{' '}
        <strong>
          {couverture.couvertes} périodes sur {couverture.total}
        </strong>{' '}
        ({pct(couverture.couvertes / couverture.total)}).
      </p>
      <div className="legende-plan" aria-hidden>
        <span>
          <span className="pastille-legende couverte" /> Couvertes
        </span>
        <span>
          <span className="pastille-legende commencee" /> Commencées
        </span>
      </div>
      <div className="barres-aires">
        {[...couverture.aires]
          .sort((a, b) => b.couvertes / b.total - a.couvertes / a.total || b.enCours - a.enCours)
          .map((a) => (
            <div key={a.aireId} className="barre-aire" title={`${aireParId(a.aireId)?.nom} : ${a.couvertes} couvertes, ${a.enCours} commencées, sur ${a.total}`}>
              <span className="barre-aire-nom">{aireParId(a.aireId)?.nom}</span>
              <span className="piste" role="img" aria-label={`${a.couvertes} périodes couvertes et ${a.enCours} commencées sur ${a.total}`}>
                <span className="segment couverte" style={{ width: `${(a.couvertes / a.total) * 100}%` }} />
                <span className="segment commencee" style={{ width: `${(a.enCours / a.total) * 100}%` }} />
              </span>
              <span className="barre-aire-valeur">
                {a.couvertes}/{a.total}
              </span>
              {a.aCreer > 0 && (
                <span className="barre-aire-note discret">
                  {a.aCreer} fiche{a.aCreer > 1 ? 's' : ''} à créer
                </span>
              )}
            </div>
          ))}
      </div>

      <h2 className="titre-oral">Mémorisation</h2>
      <div className="stats-revision stats-projection">
        <Stat valeur={memo.total ? pct(memo.maitrisees / memo.total) : '—'} libelle={`des œuvres maîtrisées (${memo.maitrisees}/${memo.total})`} />
        <Stat valeur={memo.reussite === undefined ? '—' : pct(memo.reussite)} libelle="de bonnes réponses en révision" />
        <Stat valeur={pct(memo.glossaire)} libelle="du glossaire maîtrisé" />
        <Stat valeur={pct(memo.anglais)} libelle="du vocabulaire anglais" />
      </div>
      <p className="discret">
        {memo.vues} œuvres déjà révisées sur {memo.total}.{memo.enRetard > 0 && ` ${memo.enRetard} cartes en retard de plus de 2 jours : rattrape-les en priorité.`}
      </p>

      <h2 className="titre-oral">Notes des sujets blancs</h2>
      <Notes notes={notes} ouvrirCopie={ouvrirCopie} />

      <h2 className="titre-oral">Rythme</h2>
      {semaines.length === 0 ? (
        <p className="discret">
          Crée ton plan de révision pour comparer le temps fait au temps prévu.{' '}
          <button className="lien" onClick={ouvrirPlan}>
            Créer le plan
          </button>
        </p>
      ) : (
        <>
          <p>
            <strong>{formatDuree(faitesTotal)}</strong> faites sur {formatDuree(prevuesTotal)} prévues ces 6 dernières semaines
            {prevuesTotal > 0 && ` (${pct(faitesTotal / prevuesTotal)})`}.
          </p>
          <div className="barres-semaines">
            {semaines.map((s) => (
              <div key={s.lundi} className="barre-aire">
                <span className="barre-aire-nom">sem. du {jourCourt(s.lundi).replace(/^\S+\s/, '')}</span>
                <span className="piste" role="img" aria-label={`${s.faites} minutes faites sur ${s.prevues} prévues`}>
                  <span className="segment couverte" style={{ width: `${s.prevues ? Math.min(100, (s.faites / s.prevues) * 100) : 0}%` }} />
                </span>
                <span className="barre-aire-valeur">
                  {s.prevues ? `${formatDuree(s.faites)} / ${formatDuree(s.prevues)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="projections-dates">
        {projections.map((p) => (
          <PhraseProjection
            key={p.nom}
            p={p}
            dateEcrits={dateEcrits}
            possibleLe={projectionPossibleLe(d.historique, aujourdhui)}
            aCreer={couverture.aires.filter((a) => GROUPES.find((g) => g.nom === p.nom)!.aires.includes(a.aireId)).reduce((t, a) => t + a.aCreer, 0)}
          />
        ))}
      </div>
      <p className="discret">
        Calculé au rythme des 4 dernières semaines (œuvres maîtrisées gagnées), à partir de la photo de ta progression que l’appli prend chaque jour.
      </p>
    </section>
  );
}

function Stat({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="stat">
      <span className="stat-valeur">{valeur}</span>
      <span className="stat-libelle">{libelle}</span>
    </div>
  );
}

function TuilePret({ p }: { p: Preparation }) {
  return (
    <div className="tuile-pret">
      <span className="tuile-pret-nom">{p.nom}</span>
      <span className="tuile-pret-valeur">{pct(p.score)}</span>
      <span className="barre" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.score * 100)} aria-label={p.nom}>
        <span style={{ width: `${p.score * 100}%` }} />
      </span>
      <span className="tuile-pret-niveau">{p.niveau}</span>
    </div>
  );
}

function LignePret({ p }: { p: Preparation }) {
  return (
    <details className="ligne-pret">
      <summary>
        <span className="ligne-pret-nom">{p.nom}</span>
        <span className="ligne-pret-niveau">
          {pct(p.score)} · {p.niveau}
          {p.incomplet && ' · incomplet'}
        </span>
        <span className="barre">
          <span style={{ width: `${p.score * 100}%` }} />
        </span>
      </summary>
      <ul className="composantes">
        {p.composantes.map((c) => (
          <li key={c.nom}>
            <span>
              {c.nom} <span className="discret">({Math.round(c.poids * 100)} % de l’indicateur)</span>
            </span>
            <span className={c.valeur === undefined ? 'discret' : ''}>{c.valeur === undefined ? `non mesuré : ${c.detail}` : `${pct(c.valeur)} · ${c.detail}`}</span>
          </li>
        ))}
      </ul>
      {p.incomplet && <p className="discret">Ce qui n’est pas encore mesuré est laissé de côté : l’indicateur se précisera avec tes prochaines copies et oraux.</p>}
    </details>
  );
}

function PhraseProjection({ p, dateEcrits, possibleLe, aCreer }: { p: ProjectionCouverture; dateEcrits: string; possibleLe: string; aCreer: number }) {
  const fiches = aCreer > 0 ? ` Il te faut aussi ${aCreer} fiche${aCreer > 1 ? 's' : ''} de plus dans les périodes peu fournies : la date suppose que tu les crées.` : '';
  if (p.etat === 'couvert') return <p className="phrase-projection ok">Tu couvres déjà {p.nom}.</p>;
  if (p.etat === 'pas-de-recul')
    return (
      <p className="phrase-projection">
        {p.nom.charAt(0).toUpperCase() + p.nom.slice(1)} : il manque {p.manquantes} œuvres maîtrisées. La date de couverture sera estimée à partir du{' '}
        {dateLongue(possibleLe)}, après une semaine de recul.{fiches}
      </p>
    );
  if (p.etat === 'stagne')
    return (
      <p className="phrase-projection alerte">
        {p.nom.charAt(0).toUpperCase() + p.nom.slice(1)} : aucune nouvelle œuvre maîtrisée ces dernières semaines ({p.manquantes} manquent). À ce rythme, la
        couverture n’avance pas.{fiches}
      </p>
    );
  return (
    <p className={`phrase-projection ${p.avantEcrits ? 'ok' : 'alerte'}`}>
      Tu couvres {p.nom} vers le <strong>{dateLongue(p.date!)}</strong>, soit <strong>{p.avantEcrits ? 'avant' : 'après'} les écrits</strong> (
      {dateLongue(dateEcrits)}) si rien ne change. Rythme : {virgule(p.parSemaine ?? 0)} œuvre{(p.parSemaine ?? 0) >= 2 ? 's' : ''} maîtrisée
      {(p.parSemaine ?? 0) >= 2 ? 's' : ''} par semaine, {p.manquantes} à gagner.{fiches}
    </p>
  );
}

// ——— Graphique des notes ———

const SERIES: TypeEpreuve[] = ['specialite', 'culture', 'synthese'];
const nomCourt = (t: TypeEpreuve) => TYPES_EPREUVE.find((x) => x.id === t)!.court;
/** Nom pour l'étiquette en bout de courbe (place comptée). */
const nomGraphique = (t: TypeEpreuve) => ({ specialite: 'Spécialité', culture: 'Culture', synthese: 'Synthèse' })[t];

function Notes({ notes, ouvrirCopie }: { notes: NoteSujet[]; ouvrirCopie: (id: string) => void }) {
  const [ajout, setAjout] = useState(false);
  return (
    <>
      {notes.length === 0 ? (
        <p className="discret">Pas encore de copie notée : fais corriger un sujet blanc par l’IA, ou ajoute la note d’un correcteur.</p>
      ) : (
        <>
          <GraphiqueNotes notes={notes} />
          <ul className="tendances">
            {SERIES.map((t) => {
              const x = tendance(notes, t);
              if (!x.nombre) return null;
              return (
                <li key={t}>
                  <span className={`pastille-serie serie-${SERIES.indexOf(t) + 1}`} aria-hidden /> <strong>{nomCourt(t)}</strong> :{' '}
                  {x.nombre === 1 ? `${virgule(x.recente!)}/20 sur une seule copie` : `${virgule(x.recente!)}/20 en moyenne sur les ${Math.min(3, x.nombre)} dernières`}
                  {x.evolution !== undefined && ` (${x.evolution >= 0 ? '+' : '−'}${virgule(Math.abs(x.evolution))} par rapport aux 3 précédentes)`}
                </li>
              );
            })}
          </ul>
          <details className="bloc">
            <summary>Toutes les notes ({notes.length})</summary>
            <table className="table-notes">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Épreuve</th>
                  <th>Note</th>
                  <th>Par</th>
                </tr>
              </thead>
              <tbody>
                {[...notes].reverse().map((n) => (
                  <tr key={n.copieId} onClick={() => ouvrirCopie(n.copieId)}>
                    <td>{jourCourt(n.date)}</td>
                    <td>{nomCourt(n.type)}</td>
                    <td>
                      <strong>{virgule(n.note)}</strong>
                    </td>
                    <td>{n.source === 'correcteur' ? 'correcteur' : 'IA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
      {ajout ? (
        <AjoutNote fermer={() => setAjout(false)} />
      ) : (
        <button className="lien" onClick={() => setAjout(true)}>
          + Ajouter la note d’un sujet fait hors de l’appli
        </button>
      )}
    </>
  );
}

function GraphiqueNotes({ notes }: { notes: NoteSujet[] }) {
  const [survol, setSurvol] = useState<NoteSujet>();
  const L = 340;
  const H = 180;
  const m = { g: 26, d: 74, h: 10, b: 24 };
  const t = (j: string) => new Date(`${j}T00:00:00`).getTime();
  const t0 = t(notes[0].date);
  const t1 = Math.max(t(notes.at(-1)!.date), t0 + 86_400_000 * 7);
  const x = (j: string) => m.g + ((t(j) - t0) / (t1 - t0)) * (L - m.g - m.d);
  const y = (n: number) => m.h + (1 - n / 20) * (H - m.h - m.b);
  const series = SERIES.map((s, i) => ({ s, i, points: notes.filter((n) => n.type === s) })).filter((x) => x.points.length);
  // Étiquettes directes en bout de courbe, écartées si elles se chevauchent.
  const etiquettes = series.map((r) => ({ ...r, yLabel: y(r.points.at(-1)!.note) })).sort((a, b) => a.yLabel - b.yLabel);
  for (let k = 1; k < etiquettes.length; k++) etiquettes[k].yLabel = Math.max(etiquettes[k].yLabel, etiquettes[k - 1].yLabel + 13);
  return (
    <div className="graphique-notes">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Évolution des notes des sujets blancs, sur 20">
        {[0, 5, 10, 15, 20].map((n) => (
          <g key={n}>
            <line x1={m.g} x2={L - m.d} y1={y(n)} y2={y(n)} className="grille" />
            <text x={m.g - 6} y={y(n) + 3} className="axe" textAnchor="end">
              {n}
            </text>
          </g>
        ))}
        <text x={m.g} y={H - 6} className="axe">
          {jourCourt(notes[0].date)}
        </text>
        <text x={L - m.d} y={H - 6} className="axe" textAnchor="end">
          {jourCourt(cleJour(new Date(t1)))}
        </text>
        {series.map((r) => (
          <g key={r.s} className={`serie serie-${r.i + 1}`}>
            {r.points.length > 1 && <polyline points={r.points.map((p) => `${x(p.date)},${y(p.note)}`).join(' ')} />}
            {r.points.map((p) => (
              <g key={p.copieId}>
                <circle cx={x(p.date)} cy={y(p.note)} r={4} className={p.source === 'correcteur' ? 'point-note correcteur' : 'point-note'} />
                <circle
                  cx={x(p.date)}
                  cy={y(p.note)}
                  r={12}
                  className="zone-survol"
                  tabIndex={0}
                  aria-label={`${nomCourt(p.type)}, ${jourCourt(p.date)} : ${virgule(p.note)} sur 20 (${p.source === 'correcteur' ? 'correcteur' : 'IA'})`}
                  onPointerEnter={() => setSurvol(p)}
                  onPointerLeave={() => setSurvol(undefined)}
                  onFocus={() => setSurvol(p)}
                  onBlur={() => setSurvol(undefined)}
                />
              </g>
            ))}
          </g>
        ))}
        {etiquettes.map((e) => (
          <text key={e.s} x={L - m.d + 8} y={e.yLabel + 4} className="etiquette-serie">
            {nomGraphique(e.s)}
          </text>
        ))}
      </svg>
      {survol && (
        <div className="info-bulle" style={{ left: `${Math.min(70, Math.max(30, (x(survol.date) / L) * 100))}%`, top: `${(y(survol.note) / H) * 100}%` }}>
          <strong>{virgule(survol.note)}/20</strong>
          <span>
            {nomCourt(survol.type)} · {jourCourt(survol.date)} · {survol.source === 'correcteur' ? 'correcteur' : 'IA'}
          </span>
        </div>
      )}
      <div className="legende-plan">
        {series.map((r) => (
          <span key={r.s}>
            <span className={`pastille-serie serie-${r.i + 1}`} /> {nomCourt(r.s)}
          </span>
        ))}
        <span>○ note d’un correcteur · ● note de l’IA</span>
      </div>
    </div>
  );
}

function AjoutNote({ fermer }: { fermer: () => void }) {
  const [type, setType] = useState<TypeEpreuve>('specialite');
  const [date, setDate] = useState(cleJour(new Date()));
  const [sujet, setSujet] = useState('');
  const [valeur, setValeur] = useState('');
  const [correcteur, setCorrecteur] = useState('');
  const n = Number(valeur.replace(',', '.'));
  const valide = sujet.trim() && valeur.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 20;
  return (
    <form
      className="bloc formulaire"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valide) return;
        const moment = new Date(`${date}T12:00:00`).toISOString();
        await creerCopie({
          type,
          sujetId: 'hors-appli',
          sujet: sujet.trim(),
          mode: 'manuscrit',
          debut: moment,
          fin: moment,
          dureePrevueMin: 240,
          noteCorrecteur: { note: Math.round(n * 2) / 2, correcteur: correcteur.trim(), le: new Date().toISOString() },
        });
        fermer();
      }}
    >
      <h3>Sujet blanc fait hors de l’appli</h3>
      <ChoixType valeur={type} changer={setType} />
      <label>
        Sujet
        <input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Intitulé du sujet" />
      </label>
      <div className="deux-colonnes">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <label>
          Note sur 20
          <input inputMode="decimal" value={valeur} onChange={(e) => setValeur(e.target.value)} placeholder="Ex. : 12,5" />
        </label>
      </div>
      <label>
        Correcteur
        <input value={correcteur} onChange={(e) => setCorrecteur(e.target.value)} placeholder="Ex. : prépa, binôme" />
      </label>
      <div className="actions">
        <button type="button" className="bouton" onClick={fermer}>
          Annuler
        </button>
        <button type="submit" className="bouton principal" disabled={!valide}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
