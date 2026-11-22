import { useState } from 'react';
import { formatChrono } from '../../domain/examen';
import { formatDuree } from '../../domain/examen';
import { NOMS_CATEGORIES, texteDisponible } from '../../domain/oral';
import { db, modifierOral, supprimerOral } from '../../lib/db';
import { bilanOral, expliquerErreur, iaPrete } from '../../lib/ia';
import { useLive } from '../../lib/useLive';
import { DossierVue, LecteurAudio, TexteAuto } from './communs';

/** Un oral terminé : réécoute, transcriptions, pistes attendues et bilan du jury par l'IA. */
export function OralDetail({ id, retour, ouvrirFiche }: { id: string; retour: () => void; ouvrirFiche: (id: string) => void }) {
  const oral = useLive(() => db.oraux.get(id), [id]);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });
  if (!oral) return <section className="panneau" />;

  const demanderBilan = async () => {
    setEtat({ enCours: true });
    try {
      // Relecture : les dernières corrections de texte viennent d'être enregistrées.
      const frais = (await db.oraux.get(id)) ?? oral;
      await modifierOral(id, { bilan: await bilanOral(frais) });
      setEtat({ enCours: false });
    } catch (e) {
      setEtat({ enCours: false, erreur: await expliquerErreur(e) });
    }
  };

  const date = new Date(oral.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dureeEpreuve = oral.debutEpreuve && oral.fin ? Math.round((new Date(oral.fin).getTime() - new Date(oral.debutEpreuve).getTime()) / 60000) : undefined;

  return (
    <section className="panneau examen oral">
      <div className="carte-sujet petite">
        <span className="carte-mot-categorie">
          Oral du {date} · {formatDuree(oral.dureePrepMin)} + {formatDuree(oral.dureeEpreuveMin)}
          {dureeEpreuve !== undefined && ` · épreuve réelle ${formatDuree(Math.max(1, dureeEpreuve))}`}
        </span>
        <span className="carte-sujet-intitule">{oral.dossier.mode === 'theme' ? `Thème : ${oral.dossier.theme}` : oral.dossier.consigne}</span>
      </div>
      <DossierVue dossier={oral.dossier} cartels ouvrirFiche={ouvrirFiche} />

      <details className="bloc">
        <summary>Tes notes de préparation</summary>
        <p className="texte-copie">{oral.notes || '—'}</p>
      </details>

      <div className="bloc">
        <h3>
          Ton exposé
          {oral.exposeDureeSec ? ` · ${formatChrono(Math.round(oral.exposeDureeSec))} (prévu ${oral.dureeExposeMin} min)` : ''}
        </h3>
        {oral.exposeAudio ? <LecteurAudio fichierId={oral.exposeAudio} /> : <p className="discret">Pas d’enregistrement.</p>}
        <TexteAuto
          rows={5}
          initial={oral.exposeTexte}
          placeholder="Transcription ou résumé de ton exposé (sert au bilan de l’IA)."
          enregistrer={(exposeTexte) => modifierOral(id, { exposeTexte })}
          aria-label="Transcription ou résumé de l’exposé"
        />
      </div>

      {oral.questions.length > 0 && (
        <>
          <h2 className="titre-oral">Entretien avec le jury</h2>
          {oral.questions.map((q, i) => (
            <div key={q.id} className="bloc question-revue">
              <span className="carte-mot-categorie">
                Question {i + 1} · {NOMS_CATEGORIES[q.categorie]}
                {q.dureeSec ? ` · réponse de ${formatChrono(Math.round(q.dureeSec))}` : ''}
              </span>
              <p className="question-texte">{q.question}</p>
              {q.audio ? <LecteurAudio fichierId={q.audio} /> : <p className="discret">Pas de réponse enregistrée.</p>}
              <TexteAuto
                rows={3}
                initial={q.texte ?? ''}
                placeholder="Ta réponse par écrit (facultatif)"
                enregistrer={async (texte) => {
                  const frais = await db.oraux.get(id);
                  if (frais) await modifierOral(id, { questions: frais.questions.map((x) => (x.id === q.id ? { ...x, texte } : x)) });
                }}
                aria-label={`Réponse à la question ${i + 1}`}
              />
              {q.attendu && (
                <details className="attendu">
                  <summary>Ce qu’attendait le jury</summary>
                  <p>{q.attendu}</p>
                </details>
              )}
            </div>
          ))}
        </>
      )}

      {!oral.bilan && (
        <div className="bloc appel-ia">
          <h3>Bilan du jury par l’IA</h3>
          <p className="discret">
            Appréciation, note indicative, points forts, à améliorer, conseils et un commentaire par réponse. L’IA ne peut pas écouter l’audio : elle lit tes notes,
            les transcriptions et tes résumés.
          </p>
          {!iaPrete() ? (
            <p className="discret">À activer dans Menu › Réglages › Intelligence artificielle (clé d’API et accord).</p>
          ) : (
            <button className="bouton principal large" disabled={etat.enCours || !texteDisponible(oral)} onClick={demanderBilan}>
              {etat.enCours ? 'Le jury délibère… (jusqu’à une minute)' : 'Demander le bilan du jury'}
            </button>
          )}
          {!texteDisponible(oral) && <p className="discret">Écris d’abord au moins un résumé de ton exposé ou d’une réponse.</p>}
          {etat.erreur && <p className="erreur">{etat.erreur}</p>}
        </div>
      )}

      {oral.bilan && (
        <div className="correction">
          <div className="note-globale">
            <span className="stat-valeur">{String(oral.bilan.noteSur20).replace('.', ',')}</span>
            <span className="stat-libelle">/ 20 · note indicative</span>
          </div>
          <p>{oral.bilan.appreciation}</p>
          <Liste titre="Points forts" items={oral.bilan.pointsForts} />
          <Liste titre="À améliorer" items={oral.bilan.aAmeliorer} />
          <Liste titre="Conseils pour le prochain oral" items={oral.bilan.conseils} />
          {oral.bilan.parQuestion.length > 0 && (
            <div className="bloc">
              <h3>Sur tes réponses</h3>
              {oral.bilan.parQuestion.map((q) => (
                <div key={q.question} className="commentaire-question">
                  <p className="partie">{q.question}</p>
                  <p>{q.commentaire}</p>
                </div>
              ))}
            </div>
          )}
          <p className="discret">Ce bilan complète celui d’un enseignant ou d’un pair, sans le remplacer.</p>
        </div>
      )}

      <div className="actions">
        {oral.bilan && iaPrete() && (
          <button className="bouton" disabled={etat.enCours} onClick={demanderBilan}>
            {etat.enCours ? '…' : 'Refaire le bilan'}
          </button>
        )}
        <button
          className="bouton danger"
          onClick={async () => {
            if (!confirm('Supprimer cet oral et ses enregistrements ?')) return;
            await supprimerOral(id);
            retour();
          }}
        >
          Supprimer
        </button>
      </div>
      {etat.erreur && oral.bilan && <p className="erreur">{etat.erreur}</p>}
    </section>
  );
}

function Liste({ titre, items }: { titre: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="bloc">
      <h3>{titre}</h3>
      <ul className="points">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
