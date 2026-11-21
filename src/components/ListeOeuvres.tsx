import { useMemo, useState } from 'react';
import { AIRES, periodeParId } from '../domain/catalogue';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';
import { Vignette } from './Vignette';

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function ListeOeuvres({ ouvrir, creer, aireInitiale }: { ouvrir: (id: string) => void; creer: () => void; aireInitiale?: string }) {
  const oeuvres = useLive(() => db.oeuvres.toArray(), []);
  const [texte, setTexte] = useState('');
  const [aire, setAire] = useState(aireInitiale ?? '');

  const visibles = useMemo(() => {
    const q = normaliser(texte.trim());
    return (oeuvres ?? [])
      .filter((o) => !aire || o.aireId === aire)
      .filter(
        (o) =>
          !q ||
          normaliser(
            [o.titre, o.site, o.datation, o.conservation, o.iconographie, periodeParId(o.periodeId)?.nom ?? '', ...o.etiquettes].join(' '),
          ).includes(q),
      )
      .sort((a, b) => (a.debut ?? Infinity) - (b.debut ?? Infinity) || a.titre.localeCompare(b.titre, 'fr'));
  }, [oeuvres, texte, aire]);

  return (
    <section className="panneau">
      <div className="barre-recherche">
        <input type="search" placeholder="Rechercher une œuvre, un site, une dynastie…" value={texte} onChange={(e) => setTexte(e.target.value)} />
        <select value={aire} onChange={(e) => setAire(e.target.value)} aria-label="Aire culturelle">
          <option value="">Toutes les aires</option>
          {AIRES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </div>

      {oeuvres && oeuvres.length === 0 && !aire && (
        <div className="vide-etat">
          <p>Aucune fiche pour l’instant.</p>
          <p className="discret">Commencez par une œuvre de référence : le Bouddha de Sarnath, le Naṭarāja chola, un linteau khmer du Guimet…</p>
          <button className="bouton principal" onClick={creer}>
            Créer la première fiche
          </button>
        </div>
      )}

      {oeuvres && oeuvres.length > 0 && <p className="discret compteur">{visibles.length} œuvre(s)</p>}
      {oeuvres && aire && visibles.length === 0 && <p className="discret">Aucune fiche dans cette aire pour l’instant.</p>}

      <ul className="grille">
        {visibles.map((o) => (
          <li key={o.id}>
            <button className="carte-oeuvre" onClick={() => ouvrir(o.id)}>
              <Vignette imageId={o.imagePrincipaleId} alt={o.titre} />
              <span className="carte-titre">{o.titre}</span>
              <span className="carte-sous-titre">{[periodeParId(o.periodeId)?.nom, o.datation].filter(Boolean).join(' · ')}</span>
            </button>
          </li>
        ))}
      </ul>

      <button className="fab" onClick={creer} aria-label="Nouvelle fiche">
        +
      </button>
    </section>
  );
}
