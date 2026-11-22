import { useEffect, useState } from 'react';
import { formatDuree } from '../../domain/examen';
import {
  ajouterJours,
  cleJour,
  type DemandePlan,
  demandeParDefaut,
  ecartJours,
  type Jalon,
  jourSemaine,
  type Lacunes,
  lundiDe,
  NOMS_PHASES,
  NOMS_SEANCES,
  phaseDu,
  type Seance,
  type TypeSeance,
} from '../../domain/plan';
import { db, lireDemandePlan, supprimerPlan } from '../../lib/db';
import { construirePlan, mesurerLacunesActuelles } from '../../lib/plan';
import type { Reglages } from '../../lib/reglages';
import { useLive } from '../../lib/useLive';
import { COULEUR_SEANCE, jourCourt, jourLong, LigneSeance, useActivites } from './communs';

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  reglages: Reglages;
  modifierReglages: (c: Partial<Reglages>) => void;
  lancer: (s: Seance) => void;
}

/** Plan de révision : réglages et génération, puis calendrier (semaine ou mois). */
export function PlanRevision({ reglages, modifierReglages, lancer }: Props) {
  const demande = useLive(async () => (await lireDemandePlan()) ?? null, []);
  const [edition, setEdition] = useState(false);
  if (demande === undefined) return <section className="panneau" />;
  if (!demande || edition)
    return (
      <FormulairePlan
        initiale={demande ?? demandeParDefaut(reglages.dateEcrits)}
        existe={!!demande}
        annuler={demande ? () => setEdition(false) : undefined}
        valider={async (d) => {
          if (d.dateEcrits !== reglages.dateEcrits) modifierReglages({ dateEcrits: d.dateEcrits });
          await construirePlan(d);
          setEdition(false);
        }}
      />
    );
  return <Calendrier demande={demande} lancer={lancer} modifier={() => setEdition(true)} />;
}

function Puces<T extends number>({ valeurs, valeur, changer, format, nom }: { valeurs: T[]; valeur: T; changer: (v: T) => void; format: (v: T) => string; nom: string }) {
  return (
    <div className="puces" role="radiogroup" aria-label={nom}>
      {valeurs.map((v) => (
        <button key={v} type="button" role="radio" aria-checked={valeur === v} className={valeur === v ? 'actif' : ''} onClick={() => changer(v)}>
          {format(v)}
        </button>
      ))}
    </div>
  );
}

function ChoixJours({ jours, changer, parmi, nom }: { jours: number[]; changer: (j: number[]) => void; parmi?: number[]; nom: string }) {
  return (
    <div className="puces jours" role="group" aria-label={nom}>
      {LETTRES.map((l, i) =>
        parmi && !parmi.includes(i) ? null : (
          <button
            key={i}
            type="button"
            aria-pressed={jours.includes(i)}
            aria-label={['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][i]}
            className={jours.includes(i) ? 'actif' : ''}
            onClick={() => changer(jours.includes(i) ? jours.filter((j) => j !== i) : [...jours, i].sort())}
          >
            {l}
          </button>
        ),
      )}
    </div>
  );
}

function ConstatsLacunes({ lacunes }: { lacunes?: Lacunes }) {
  if (!lacunes) return <p className="discret">Mesure de tes lacunes…</p>;
  return (
    <ul className="points constats">
      {lacunes.constats.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

function FormulairePlan({ initiale, existe, annuler, valider }: { initiale: DemandePlan; existe: boolean; annuler?: () => void; valider: (d: DemandePlan) => Promise<void> }) {
  const [d, setD] = useState(initiale);
  const [lacunes, setLacunes] = useState<Lacunes>();
  const [enCours, setEnCours] = useState(false);
  const [jalon, setJalon] = useState<Omit<Jalon, 'id'>>({ nom: '', date: '' });
  useEffect(() => {
    mesurerLacunesActuelles().then(setLacunes).catch(console.error);
  }, []);
  const maj = (c: Partial<DemandePlan>) => setD((x) => ({ ...x, ...c }));
  const erreur =
    d.jours.length === 0
      ? 'Choisis au moins un jour de travail.'
      : !(d.debut < d.dateEcrits && d.dateEcrits < d.dateAdmissibilite && d.dateAdmissibilite < d.dateOral)
        ? 'Les dates doivent se suivre : début, écrits, admissibilité, oraux.'
        : undefined;

  return (
    <section className="panneau plan">
      <p className="discret">
        Un plan semaine par semaine jusqu’aux oraux : travail de fond, affûtage les 5 dernières semaines avant les écrits, puis bascule sur l’oral après
        l’admissibilité. Les séances tiennent compte de tes jours, de ton temps et des lacunes mesurées par l’appli.
      </p>
      <div className="formulaire">
        <span className="libelle">Dates</span>
        <div className="dates-plan">
          <label>
            Début
            <input type="date" value={d.debut} onChange={(e) => e.target.value && maj({ debut: e.target.value })} />
          </label>
          <label>
            Écrits
            <input type="date" value={d.dateEcrits} onChange={(e) => e.target.value && maj({ dateEcrits: e.target.value })} />
          </label>
          <label>
            Résultats d’admissibilité
            <input type="date" value={d.dateAdmissibilite} onChange={(e) => e.target.value && maj({ dateAdmissibilite: e.target.value })} />
          </label>
          <label>
            Oraux
            <input type="date" value={d.dateOral} onChange={(e) => e.target.value && maj({ dateOral: e.target.value })} />
          </label>
        </div>
        <p className="discret">Ce sont des estimations : corrige-les dès que le calendrier officiel de la session 2027 sera publié.</p>

        <span className="libelle">Jours de travail</span>
        <ChoixJours nom="Jours de travail" jours={d.jours} changer={(jours) => maj({ jours, joursLongs: d.joursLongs.filter((j) => jours.includes(j)) })} />
        <span className="libelle">Temps par jour</span>
        <Puces nom="Temps par jour" valeurs={[30, 45, 60, 90, 120]} valeur={d.minutesCourtes} changer={(minutesCourtes) => maj({ minutesCourtes })} format={formatDuree} />

        <span className="libelle">Jours avec une longue plage (sujet blanc, visite, oral blanc)</span>
        <ChoixJours nom="Jours longs" jours={d.joursLongs} parmi={d.jours} changer={(joursLongs) => maj({ joursLongs })} />
        {d.joursLongs.length > 0 && (
          <Puces nom="Temps des jours longs" valeurs={[120, 180, 240, 300, 360]} valeur={d.minutesLongues} changer={(minutesLongues) => maj({ minutesLongues })} format={formatDuree} />
        )}

        <span className="libelle">Durée d’un sujet blanc</span>
        <Puces nom="Durée d’un sujet blanc" valeurs={[180, 240, 300]} valeur={d.dureeSujetBlanc} changer={(dureeSujetBlanc) => maj({ dureeSujetBlanc })} format={formatDuree} />
        {d.minutesLongues < d.dureeSujetBlanc && <p className="discret">Ta plage longue est plus courte qu’un sujet blanc : le plan n’en proposera pas.</p>}

        <span className="libelle">Visites au musée Guimet</span>
        <Puces
          nom="Visites"
          valeurs={[0, 2, 3, 4, 6]}
          valeur={d.visitesToutesLes}
          changer={(visitesToutesLes) => maj({ visitesToutesLes })}
          format={(n) => (n === 0 ? 'Aucune' : `Toutes les ${n} sem.`)}
        />

        <span className="libelle">Démarches et échéances</span>
        {d.jalons.map((j) => (
          <div key={j.id} className="jalon-ligne">
            <span>
              {jourCourt(j.date)} · {j.nom}
            </span>
            <button type="button" className="lien danger" onClick={() => maj({ jalons: d.jalons.filter((x) => x.id !== j.id) })}>
              Retirer
            </button>
          </div>
        ))}
        <div className="jalon-ajout">
          <input placeholder="Ex. : clôture des inscriptions" value={jalon.nom} onChange={(e) => setJalon({ ...jalon, nom: e.target.value })} aria-label="Démarche" />
          <input type="date" value={jalon.date} onChange={(e) => setJalon({ ...jalon, date: e.target.value })} aria-label="Date de la démarche" />
          <button
            type="button"
            className="bouton"
            disabled={!jalon.nom.trim() || !jalon.date}
            onClick={() => {
              maj({ jalons: [...d.jalons, { id: crypto.randomUUID(), nom: jalon.nom.trim(), date: jalon.date }].sort((a, b) => a.date.localeCompare(b.date)) });
              setJalon({ nom: '', date: '' });
            }}
          >
            Ajouter
          </button>
        </div>
        <p className="discret">Inscription au concours, Prépa Talents, convocation… Les dates officielles sont à vérifier sur le site du ministère et de l’INP.</p>

        <span className="libelle">Ce que l’appli a mesuré</span>
        <ConstatsLacunes lacunes={lacunes} />
      </div>
      {erreur && <p className="erreur">{erreur}</p>}
      <button
        className="bouton principal large grand"
        disabled={!!erreur || enCours}
        onClick={async () => {
          setEnCours(true);
          await valider(d);
          setEnCours(false);
        }}
      >
        {enCours ? 'Calcul du plan…' : existe ? 'Mettre à jour le plan' : 'Générer mon plan'}
      </button>
      {existe && <p className="discret">Les séances passées et celles déjà faites sont gardées.</p>}
      {annuler && (
        <button className="bouton large" onClick={annuler}>
          Annuler
        </button>
      )}
    </section>
  );
}

function Calendrier({ demande, lancer, modifier }: { demande: DemandePlan; lancer: (s: Seance) => void; modifier: () => void }) {
  const aujourdhui = cleJour(new Date());
  const seances = useLive(() => db.seances.orderBy('date').toArray(), []);
  const activites = useActivites();
  const [vue, setVue] = useState<'semaine' | 'mois'>('semaine');
  const [lundi, setLundi] = useState(lundiDe(aujourdhui));
  const [mois, setMois] = useState(aujourdhui.slice(0, 7));
  const [jourChoisi, setJourChoisi] = useState(aujourdhui);
  const [lacunes, setLacunes] = useState<Lacunes>();
  const [recalcul, setRecalcul] = useState(false);
  if (!seances) return <section className="panneau" />;

  const phase = phaseDu(aujourdhui, demande);
  const prochainJalon = seances.find((s) => s.type === 'jalon' && s.date >= aujourdhui);
  const duJour = (jour: string) => seances.filter((s) => s.date === jour);
  const semaine = Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
  const travail = semaine.flatMap(duJour).filter((s) => s.type !== 'jalon' && s.type !== 'repos');
  const faites = travail.filter((s) => s.faite || (activites && s.date <= aujourdhui && activites(s.date).has(s.type)));

  return (
    <section className="panneau plan">
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">{phase ? NOMS_PHASES[phase] : 'Plan terminé'}</span>
        <span className="carte-sujet-intitule">
          {aujourdhui < demande.dateEcrits ? `J-${ecartJours(aujourdhui, demande.dateEcrits)} avant les écrits` : aujourdhui < demande.dateOral ? `J-${ecartJours(aujourdhui, demande.dateOral)} avant les oraux` : 'Bravo pour ce parcours !'}
        </span>
        {prochainJalon && (
          <span className="discret-clair">
            Prochain jalon : {prochainJalon.titre}, {jourLong(prochainJalon.date)}
          </span>
        )}
      </div>

      <div className="onglets" role="tablist" aria-label="Affichage du calendrier">
        <button role="tab" aria-selected={vue === 'semaine'} className={vue === 'semaine' ? 'actif' : ''} onClick={() => setVue('semaine')}>
          Semaine
        </button>
        <button role="tab" aria-selected={vue === 'mois'} className={vue === 'mois' ? 'actif' : ''} onClick={() => setVue('mois')}>
          Mois
        </button>
      </div>

      {vue === 'semaine' ? (
        <>
          <div className="nav-calendrier">
            <button className="bouton-icone" aria-label="Semaine précédente" onClick={() => setLundi(ajouterJours(lundi, -7))}>
              ‹
            </button>
            <span>
              Semaine du {jourCourt(lundi)}
              {lundi !== lundiDe(aujourdhui) && (
                <button className="lien" onClick={() => setLundi(lundiDe(aujourdhui))}>
                  {' '}
                  · aujourd’hui
                </button>
              )}
            </span>
            <button className="bouton-icone" aria-label="Semaine suivante" onClick={() => setLundi(ajouterJours(lundi, 7))}>
              ›
            </button>
          </div>
          {travail.length > 0 && (
            <div className="bilan-semaine">
              <span>
                {faites.length} / {travail.length} séances · {formatDuree(travail.reduce((t, s) => t + s.dureeMin, 0))} prévues
              </span>
              <span className="barre">
                <span style={{ width: `${(faites.length / travail.length) * 100}%` }} />
              </span>
            </div>
          )}
          {semaine.map((jour) => {
            const liste = duJour(jour);
            return (
              <div key={jour} className={`jour-plan ${jour === aujourdhui ? 'aujourdhui' : ''}`}>
                <h3>
                  {jourLong(jour)}
                  {jour === aujourdhui && <span className="pastille">aujourd’hui</span>}
                </h3>
                {liste.length === 0 ? (
                  <p className="discret">Libre</p>
                ) : (
                  liste.map((s) => <LigneSeance key={s.id} s={s} activites={jour <= aujourdhui ? activites?.(jour) : undefined} lancer={lancer} />)
                )}
              </div>
            );
          })}
        </>
      ) : (
        <Mois mois={mois} changerMois={setMois} seances={seances} jourChoisi={jourChoisi} choisir={setJourChoisi} aujourdhui={aujourdhui}>
          <div className="jour-plan">
            <h3>{jourLong(jourChoisi)}</h3>
            {duJour(jourChoisi).length === 0 ? (
              <p className="discret">Libre</p>
            ) : (
              duJour(jourChoisi).map((s) => <LigneSeance key={s.id} s={s} activites={jourChoisi <= aujourdhui ? activites?.(jourChoisi) : undefined} lancer={lancer} />)
            )}
          </div>
        </Mois>
      )}

      <details
        className="bloc"
        onToggle={(e) => {
          if ((e.target as HTMLDetailsElement).open && !lacunes) mesurerLacunesActuelles().then(setLacunes);
        }}
      >
        <summary>Ce que l’appli a mesuré</summary>
        <ConstatsLacunes lacunes={lacunes} />
        <p className="discret">Recalcule le plan quand tu as progressé : les séances à venir suivent tes nouvelles lacunes.</p>
      </details>

      <div className="actions">
        <button
          className="bouton principal"
          disabled={recalcul}
          onClick={async () => {
            setRecalcul(true);
            await construirePlan(demande);
            setLacunes(await mesurerLacunesActuelles());
            setRecalcul(false);
          }}
        >
          {recalcul ? 'Calcul…' : 'Recalculer avec mes lacunes'}
        </button>
        <button className="bouton" onClick={modifier}>
          Réglages du plan
        </button>
      </div>
      <button
        className="lien danger supprimer-plan"
        onClick={async () => {
          if (confirm('Supprimer le plan et tout son historique de séances ?')) await supprimerPlan();
        }}
      >
        Supprimer le plan
      </button>
    </section>
  );
}

export function Mois({
  mois,
  changerMois,
  seances,
  jourChoisi,
  choisir,
  aujourdhui,
  children,
}: {
  mois: string;
  changerMois: (m: string) => void;
  seances: Seance[];
  jourChoisi: string;
  choisir: (j: string) => void;
  aujourdhui: string;
  children: React.ReactNode;
}) {
  const premier = `${mois}-01`;
  const debut = lundiDe(premier);
  const decaler = (n: number) => {
    const d = new Date(`${premier}T00:00:00`);
    d.setMonth(d.getMonth() + n);
    changerMois(cleJour(d).slice(0, 7));
  };
  const nbCases = Math.ceil((jourSemaine(premier) + new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0).getDate()) / 7) * 7;
  const parJour = new Map<string, Seance[]>();
  for (const s of seances) parJour.set(s.date, [...(parJour.get(s.date) ?? []), s]);
  const nom = new Date(`${premier}T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const types = [...new Set(seances.filter((s) => s.date.startsWith(mois)).map((s) => s.type))] as TypeSeance[];
  return (
    <>
      <div className="nav-calendrier">
        <button className="bouton-icone" aria-label="Mois précédent" onClick={() => decaler(-1)}>
          ‹
        </button>
        <span className="mois-nom">{nom}</span>
        <button className="bouton-icone" aria-label="Mois suivant" onClick={() => decaler(1)}>
          ›
        </button>
      </div>
      <div className="grille-mois" role="grid" aria-label={nom}>
        {LETTRES.map((l, i) => (
          <span key={i} className="entete-jour" aria-hidden>
            {l}
          </span>
        ))}
        {Array.from({ length: nbCases }, (_, i) => {
          const jour = ajouterJours(debut, i);
          const liste = parJour.get(jour) ?? [];
          const horsMois = !jour.startsWith(mois);
          const jalon = liste.some((s) => s.type === 'jalon');
          return (
            <button
              key={jour}
              role="gridcell"
              aria-selected={jour === jourChoisi}
              aria-label={`${jourLong(jour)} : ${liste.length ? liste.map((s) => s.titre).join(', ') : 'libre'}`}
              className={`case-jour ${horsMois ? 'hors-mois' : ''} ${jour === aujourdhui ? 'aujourdhui' : ''} ${jour === jourChoisi ? 'choisi' : ''} ${jalon ? 'avec-jalon' : ''}`}
              onClick={() => choisir(jour)}
            >
              <span className="numero">{Number(jour.slice(8))}</span>
              <span className="points-jour">
                {liste
                  .filter((s) => s.type !== 'jalon')
                  .slice(0, 4)
                  .map((s) => (
                    <span key={s.id} className={`point t-fond${COULEUR_SEANCE[s.type]} ${s.faite ? 'fait' : ''}`} />
                  ))}
              </span>
            </button>
          );
        })}
      </div>
      {types.length > 0 && (
        <div className="legende-plan">
          {types
            .filter((t) => t !== 'jalon')
            .map((t) => (
              <span key={t}>
                <span className={`point t-fond${COULEUR_SEANCE[t]}`} /> {NOMS_SEANCES[t]}
              </span>
            ))}
          <span>★ Jalon</span>
        </div>
      )}
      {children}
    </>
  );
}
