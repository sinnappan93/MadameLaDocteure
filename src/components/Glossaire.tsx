import { useState } from 'react';
import { CATEGORIES_GLOSSAIRE, type CategorieGlossaire, GLOSSAIRE } from '../data/glossaire';
import { chercherTermes } from '../domain/glossaire';
import type { Oeuvre } from '../domain/types';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';

/** Consultation du glossaire : recherche sans accents, filtre par catégorie, renvoi aux fiches d'exemple. */
export function Glossaire({ ouvrirFiche, reviser }: { ouvrirFiche: (id: string) => void; reviser: () => void }) {
  const [texte, setTexte] = useState('');
  const [categorie, setCategorie] = useState<CategorieGlossaire | ''>('');
  const termes = chercherTermes(texte, categorie || undefined);
  const fiches = useLive(async () => new Map((await db.oeuvres.toArray()).map((o) => [o.id, o] as [string, Oeuvre])), []);

  return (
    <section className="panneau glossaire">
      <button className="carte-du-jour" onClick={reviser}>
        <span>
          <span className="carte-du-jour-titre">Réviser le glossaire</span>
          <span className="carte-du-jour-detail">{GLOSSAIRE.length} termes en cartes, avec répétition espacée</span>
        </span>
        <span className="carte-du-jour-bouton">Réviser</span>
      </button>
      <div className="barre-recherche">
        <input type="search" placeholder="Chercher un terme : mudrā, vimāna, Garuḍa…" value={texte} onChange={(e) => setTexte(e.target.value)} />
      </div>
      <div className="puces" role="group" aria-label="Catégories">
        <button className={categorie === '' ? 'actif' : ''} aria-pressed={categorie === ''} onClick={() => setCategorie('')}>
          Tout
        </button>
        {CATEGORIES_GLOSSAIRE.map((c) => (
          <button key={c.id} className={categorie === c.id ? 'actif' : ''} aria-pressed={categorie === c.id} onClick={() => setCategorie(c.id)}>
            {c.nom}
          </button>
        ))}
      </div>
      <p className="discret compteur">{termes.length} terme(s)</p>
      {termes.length === 0 && <p className="discret">Aucun terme ne correspond.</p>}
      <dl className="liste-termes">
        {termes.map((t) => {
          const exemples = (t.exemples ?? []).map((id) => fiches?.get(id)).filter((o): o is Oeuvre => !!o);
          return (
            <div key={t.id} className="entree-terme">
              <dt>{t.terme}</dt>
              <dd>
                {t.definition}
                {exemples.length > 0 && (
                  <span className="exemples">
                    {exemples.map((o) => (
                      <button key={o.id} className="puce-fiche" onClick={() => ouvrirFiche(o.id)}>
                        {o.titre}
                      </button>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
