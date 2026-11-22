import { useState } from 'react';
import { THEMES_ORAL } from '../../data/oral';
import { AIRES } from '../../domain/catalogue';
import { formatDuree } from '../../domain/examen';
import {
  creerDossier,
  DUREES_EPREUVE,
  DUREES_EXPOSE,
  DUREES_PREP,
  FORMAT_2015,
  type ModeDossier,
  motsDuTheme,
  oeuvresDuTheme,
  type Oral,
  tirerOeuvres,
} from '../../domain/oral';
import { dicteePossible, enregistrementPossible } from '../../lib/audio';
import { creerOral, db } from '../../lib/db';
import { iaPrete } from '../../lib/ia';
import { useLive } from '../../lib/useLive';

const CLE = 'madameladocteure:oral';

export interface ReglagesOral {
  prep: number;
  epreuve: number;
  expose: number;
  mode: ModeDossier;
  nombre: number;
  aireId: string;
  sansCartels: boolean;
  themeId: string;
  joindre: boolean;
  dictee: boolean;
}

const DEFAUT: ReglagesOral = {
  prep: FORMAT_2015.prep,
  epreuve: FORMAT_2015.epreuve,
  expose: FORMAT_2015.expose,
  mode: 'oeuvres',
  nombre: 3,
  aireId: '',
  sansCartels: false,
  themeId: 'hasard',
  joindre: true,
  dictee: false,
};

export function lireReglagesOral(): ReglagesOral {
  try {
    return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) ?? '{}') };
  } catch {
    return DEFAUT;
  }
}

function Puces({ valeurs, valeur, changer, format, nom }: { valeurs: number[]; valeur: number; changer: (n: number) => void; format: (n: number) => string; nom: string }) {
  return (
    <div className="puces" role="radiogroup" aria-label={nom}>
      {valeurs.map((d) => (
        <button key={d} role="radio" aria-checked={valeur === d} className={valeur === d ? 'actif' : ''} onClick={() => changer(d)}>
          {format(d)}
        </button>
      ))}
    </div>
  );
}

const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export const resumeDossier = (o: Oral) =>
  o.dossier.mode === 'theme' ? `Thème : ${o.dossier.theme}` : o.dossier.sansCartels ? `${o.dossier.documents.length} œuvres, cartels masqués` : o.dossier.documents.map((d) => d.titre).join(' · ');

/** Préparation d'un oral blanc (dossier, format, jury) et liste des oraux passés. */
export function Simulateur({ commencer, ouvrir }: { commencer: (id: string) => void; ouvrir: (o: Oral) => void }) {
  const [r, setR] = useState(lireReglagesOral);
  const [themeLibre, setThemeLibre] = useState('');
  const [erreur, setErreur] = useState<string>();
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const oraux = useLive(async () => (await db.oraux.toArray()).sort((a, b) => b.debut.localeCompare(a.debut)), []);
  const maj = (c: Partial<ReglagesOral>) => {
    const n = { ...r, ...c };
    setR(n);
    try {
      localStorage.setItem(CLE, JSON.stringify(n));
    } catch {
      /* stockage indisponible */
    }
  };
  const format2015 = r.prep === FORMAT_2015.prep && r.epreuve === FORMAT_2015.epreuve && r.expose === FORMAT_2015.expose;

  const lancer = async () => {
    if (!oeuvres) return;
    setErreur(undefined);
    let dossier;
    if (r.mode === 'oeuvres') {
      const choisies = tirerOeuvres(oeuvres, { nombre: r.nombre, aireId: r.aireId || undefined });
      if (choisies.length === 0) return setErreur('Aucune fiche dans cette aire : choisis une autre aire.');
      dossier = creerDossier('oeuvres', choisies, r.sansCartels);
    } else {
      const libre = r.themeId === 'libre' ? themeLibre.trim() : '';
      if (r.themeId === 'libre' && !libre) return setErreur('Écris d’abord ton thème.');
      const theme = libre || (r.themeId === 'hasard' ? THEMES_ORAL[Math.floor(Math.random() * THEMES_ORAL.length)] : THEMES_ORAL.find((t) => t.id === r.themeId)!);
      const mots = typeof theme === 'string' ? motsDuTheme(theme) : theme.motsCles;
      dossier = creerDossier('theme', r.joindre ? oeuvresDuTheme(oeuvres, mots, r.nombre) : [], false, theme);
    }
    const oral = await creerOral({ dossier, dureePrepMin: r.prep, dureeEpreuveMin: r.epreuve, dureeExposeMin: Math.min(r.expose, r.epreuve) });
    commencer(oral.id);
  };

  return (
    <section className="panneau examen oral">
      <p className="discret">
        Un oral blanc complet : tu tires un dossier, tu prépares avec le chronomètre, puis tu fais ton exposé à voix haute (enregistré pour te réécouter) et tu
        réponds aux questions du jury.
      </p>

      <span className="libelle">Dossier</span>
      <div className="onglets" role="radiogroup" aria-label="Type de dossier">
        <button role="radio" aria-checked={r.mode === 'oeuvres'} className={r.mode === 'oeuvres' ? 'actif' : ''} onClick={() => maj({ mode: 'oeuvres' })}>
          Œuvres de mes fiches
        </button>
        <button role="radio" aria-checked={r.mode === 'theme'} className={r.mode === 'theme' ? 'actif' : ''} onClick={() => maj({ mode: 'theme' })}>
          Un thème
        </button>
      </div>

      {r.mode === 'oeuvres' ? (
        <div className="formulaire">
          <p className="discret">Des œuvres tirées au hasard parmi tes fiches, de la même aire si possible, à relier par une problématique.</p>
          <div>
            <span className="libelle">Nombre d’œuvres</span>
            <Puces nom="Nombre d’œuvres" valeurs={[1, 2, 3, 4]} valeur={r.nombre} changer={(nombre) => maj({ nombre })} format={String} />
          </div>
          <label>
            Aire
            <select value={r.aireId} onChange={(e) => maj({ aireId: e.target.value })}>
              <option value="">Toutes les aires</option>
              {AIRES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="case">
            <input type="checkbox" checked={r.sansCartels} onChange={(e) => maj({ sansCartels: e.target.checked })} />
            <span>Masquer les cartels : identifier les œuvres d’abord</span>
          </label>
        </div>
      ) : (
        <div className="formulaire">
          <label>
            Thème
            <select value={r.themeId} onChange={(e) => maj({ themeId: e.target.value })}>
              <option value="hasard">Au hasard</option>
              {THEMES_ORAL.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.intitule}
                </option>
              ))}
              <option value="libre">Mon propre thème…</option>
            </select>
          </label>
          {r.themeId === 'libre' && <input value={themeLibre} placeholder="Ex. : Le nāga dans l’art khmer" onChange={(e) => setThemeLibre(e.target.value)} aria-label="Ton thème" />}
          <label className="case">
            <input type="checkbox" checked={r.joindre} onChange={(e) => maj({ joindre: e.target.checked })} />
            <span>Joindre des œuvres de mes fiches liées au thème (jusqu’à {r.nombre})</span>
          </label>
        </div>
      )}

      <span className="libelle">Format</span>
      <div className="format-oral">
        <div>
          <span className="discret">Préparation</span>
          <Puces nom="Préparation" valeurs={DUREES_PREP} valeur={r.prep} changer={(prep) => maj({ prep })} format={formatDuree} />
        </div>
        <div>
          <span className="discret">Épreuve</span>
          <Puces nom="Épreuve" valeurs={DUREES_EPREUVE} valeur={r.epreuve} changer={(epreuve) => maj({ epreuve })} format={formatDuree} />
        </div>
        <div>
          <span className="discret">dont exposé (le reste : questions du jury)</span>
          <Puces nom="Exposé" valeurs={DUREES_EXPOSE.filter((d) => d < r.epreuve)} valeur={r.expose} changer={(expose) => maj({ expose })} format={formatDuree} />
        </div>
      </div>
      <p className="discret">
        Format de 2015 : 30 min de préparation, 30 min d’épreuve. La part de l’exposé (10 min) est une hypothèse : vérifie-la dans l’arrêté et les rapports de
        jury.{' '}
        {!format2015 && (
          <button className="lien" onClick={() => maj({ prep: FORMAT_2015.prep, epreuve: FORMAT_2015.epreuve, expose: FORMAT_2015.expose })}>
            Revenir au format de 2015
          </button>
        )}
      </p>

      <span className="libelle">Jury</span>
      <p className="discret">
        {iaPrete()
          ? 'L’IA joue le jury : relances sur ton exposé, puis questions de motivation et mises en situation professionnelle.'
          : 'Sans IA, le jury pose des questions de la banque (relances sur le dossier, motivation, mises en situation). Pour des relances sur ton exposé, active l’IA dans Menu › Réglages.'}
      </p>
      {dicteePossible() ? (
        <>
          <label className="case">
            <input type="checkbox" checked={r.dictee} onChange={(e) => maj({ dictee: e.target.checked })} />
            <span>Transcrire mon exposé et mes réponses (dictée du navigateur)</span>
          </label>
          <p className="discret">
            Le jury s’en sert pour te relancer et faire le bilan. Dans Chrome, le son passe par le service de reconnaissance vocale de Google ; sur certains
            téléphones, la dictée ne marche pas en même temps que l’enregistrement (l’audio reste enregistré).
          </p>
        </>
      ) : (
        <p className="discret">
          Pas de dictée en direct ici : après l’exposé et après l’oral, tu pourras transcrire tes enregistrements sur l’appareil (bouton ✎).
        </p>
      )}
      {!enregistrementPossible() && <p className="erreur">Ce navigateur ne permet pas d’enregistrer le son : l’oral se fera sans enregistrement.</p>}

      {erreur && <p className="erreur">{erreur}</p>}
      <button className="bouton principal large grand" disabled={!oeuvres} onClick={lancer}>
        Tirer le dossier et préparer · {formatDuree(r.prep)}
      </button>

      {oraux && oraux.length > 0 && (
        <>
          <h2 className="titre-oral">Mes oraux</h2>
          <ul className="liste-sujets">
            {oraux.map((o) => (
              <li key={o.id} className="sujet">
                <button className="copie-ligne" onClick={() => ouvrir(o)}>
                  <span className="carte-mot-categorie">
                    {dateCourte(o.debut)} · {formatDuree(o.dureePrepMin)} + {formatDuree(o.dureeEpreuveMin)}
                  </span>
                  <span className="sujet-intitule">{resumeDossier(o)}</span>
                  <span className={`etat-copie ${o.bilan ? 'ok' : ''}`}>
                    {o.phase !== 'termine'
                      ? 'En cours : reprendre'
                      : o.bilan
                        ? `Bilan · ${String(o.bilan.noteSur20).replace('.', ',')}/20`
                        : `Terminé · ${o.questions.filter((q) => q.audio || q.texte).length} réponse(s)`}
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
