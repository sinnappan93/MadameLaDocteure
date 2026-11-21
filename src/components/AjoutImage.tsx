import { useEffect, useRef, useState } from 'react';
import { type ResultatCommons, rechercherCommons } from '../domain/commons';
import type { Oeuvre } from '../domain/types';
import { ajouterImage } from '../lib/db';
import { reduireImage, telechargerImage } from '../lib/images';

type Onglet = 'net' | 'adresse' | 'photo';

/** Feuille d'ajout d'image : recherche sur le net (Wikimedia Commons), adresse web, ou photo de l'appareil. */
export function AjoutImage({ oeuvre, fermer }: { oeuvre: Oeuvre; fermer: () => void }) {
  const [onglet, setOnglet] = useState<Onglet>('net');
  const [erreur, setErreur] = useState<string>();
  const [occupe, setOccupe] = useState(false);

  const executer = async (action: () => Promise<void>) => {
    setErreur(undefined);
    setOccupe(true);
    try {
      await action();
      fermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="feuille-fond" onClick={fermer}>
      <div className="feuille" role="dialog" aria-label="Ajouter une image" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-entete">
          <h2>Ajouter une image</h2>
          <button className="bouton-icone" onClick={fermer} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="onglets" role="tablist">
          {(
            [
              ['net', 'Sur le net'],
              ['adresse', 'Adresse web'],
              ['photo', 'Photo'],
            ] as const
          ).map(([id, libelle]) => (
            <button key={id} role="tab" aria-selected={onglet === id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>
              {libelle}
            </button>
          ))}
        </div>

        {erreur && <p className="erreur">{erreur}</p>}
        {occupe && <p className="discret">Enregistrement de l’image…</p>}

        {onglet === 'net' && <RechercheNet oeuvre={oeuvre} occupe={occupe} choisir={(r) => executer(() => importerCommons(oeuvre.id, r))} />}
        {onglet === 'adresse' && <ParAdresse occupe={occupe} valider={(url) => executer(() => importerAdresse(oeuvre.id, url))} />}
        {onglet === 'photo' && <ParPhoto occupe={occupe} valider={(f) => executer(() => importerPhoto(oeuvre.id, f))} />}
      </div>
    </div>
  );
}

async function importerCommons(oeuvreId: string, r: ResultatCommons) {
  const { blob, largeur, hauteur } = await telechargerImage(r.urlImport);
  await ajouterImage(oeuvreId, blob, {
    source: 'commons',
    largeur,
    hauteur,
    titre: r.titre,
    auteur: r.auteur,
    licence: r.licence,
    urlOrigine: r.pageOrigine,
  });
}

async function importerAdresse(oeuvreId: string, url: string) {
  const { blob, largeur, hauteur } = await telechargerImage(url);
  await ajouterImage(oeuvreId, blob, { source: 'url', largeur, hauteur, urlOrigine: url });
}

async function importerPhoto(oeuvreId: string, fichier: File) {
  const { blob, largeur, hauteur } = await reduireImage(fichier);
  await ajouterImage(oeuvreId, blob, { source: 'photo', largeur, hauteur, titre: fichier.name });
}

function RechercheNet({ oeuvre, occupe, choisir }: { oeuvre: Oeuvre; occupe: boolean; choisir: (r: ResultatCommons) => void }) {
  const [requete, setRequete] = useState(oeuvre.requeteImage || [oeuvre.titre, oeuvre.site].filter(Boolean).join(' '));
  const [resultats, setResultats] = useState<ResultatCommons[]>([]);
  const [suite, setSuite] = useState<number>();
  const [etat, setEtat] = useState<'repos' | 'chargement' | 'fini' | 'erreur'>('repos');
  const controleur = useRef<AbortController>();

  const chercher = async (decalage = 0) => {
    if (!requete.trim()) return;
    controleur.current?.abort();
    controleur.current = new AbortController();
    setEtat('chargement');
    try {
      const page = await rechercherCommons(requete, decalage, controleur.current.signal);
      setResultats((prev) => (decalage ? [...prev, ...page.resultats] : page.resultats));
      setSuite(page.suite);
      setEtat('fini');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setEtat('erreur');
    }
  };

  // Lance la recherche avec le titre de l'œuvre dès l'ouverture.
  useEffect(() => {
    void chercher();
    return () => controleur.current?.abort();
  }, []);

  return (
    <div>
      <form
        className="barre-recherche"
        onSubmit={(e) => {
          e.preventDefault();
          void chercher();
        }}
      >
        <input type="search" value={requete} onChange={(e) => setRequete(e.target.value)} placeholder="Sarnath Buddha, Bayon, Naṭarāja…" />
        <button className="bouton principal" type="submit">
          Chercher
        </button>
      </form>
      <p className="discret">Images libres de Wikimedia Commons. Astuce : les termes anglais donnent souvent plus de résultats.</p>
      {etat === 'erreur' && <p className="erreur">Recherche impossible. Vérifiez la connexion.</p>}
      {etat === 'fini' && resultats.length === 0 && <p className="discret">Aucun résultat. Essayez d’autres mots.</p>}
      <ul className="grille resultats">
        {resultats.map((r) => (
          <li key={r.pageOrigine}>
            <button className="resultat" disabled={occupe} onClick={() => choisir(r)} title={r.description ?? r.titre}>
              <img src={r.vignette} alt={r.titre} loading="lazy" />
              <span className="credit">
                {r.licence ?? 'Licence ?'}
                {r.auteur ? ` · ${r.auteur}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {suite !== undefined && etat !== 'chargement' && (
        <button className="bouton large" onClick={() => void chercher(suite)}>
          Plus de résultats
        </button>
      )}
      {etat === 'chargement' && <p className="discret">Recherche…</p>}
    </div>
  );
}

function ParAdresse({ occupe, valider }: { occupe: boolean; valider: (url: string) => void }) {
  const [url, setUrl] = useState('');
  const valide = /^https?:\/\/\S+$/i.test(url.trim());
  return (
    <form
      className="formulaire"
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) valider(url.trim());
      }}
    >
      <label>
        Adresse de l’image
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/image.jpg" />
      </label>
      <p className="discret">Collez l’adresse de l’image elle-même (appui long sur l’image › « Copier l’adresse de l’image »).</p>
      <button className="bouton principal" disabled={!valide || occupe}>
        Importer
      </button>
    </form>
  );
}

function ParPhoto({ occupe, valider }: { occupe: boolean; valider: (f: File) => void }) {
  return (
    <div className="formulaire">
      <p className="discret">Une photo prise au musée, ou la page d’un catalogue.</p>
      <label className="bouton principal depot">
        Prendre ou choisir une photo
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={occupe}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) valider(f);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
