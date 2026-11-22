import { useState } from 'react';
import { AIRES, formatAnnee, PERIODES, periodeParId } from '../domain/catalogue';
import { type NouvelleOeuvre, type Oeuvre, oeuvreVide } from '../domain/types';

interface Props {
  initiale?: Oeuvre;
  enregistrer: (donnees: NouvelleOeuvre) => void;
  annuler: () => void;
}

const nombre = (s: string) => (s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s));

export function FormulaireOeuvre({ initiale, enregistrer, annuler }: Props) {
  const [o, setO] = useState<NouvelleOeuvre>(() => {
    if (!initiale) return oeuvreVide();
    const { id: _id, creeeLe: _c, modifieeLe: _m, ...reste } = initiale;
    return reste;
  });
  const [etiquettes, setEtiquettes] = useState(o.etiquettes.join(', '));
  const maj = <K extends keyof NouvelleOeuvre>(cle: K, valeur: NouvelleOeuvre[K]) => setO((p) => ({ ...p, [cle]: valeur }));

  const choisirPeriode = (id: string) => {
    const p = periodeParId(id);
    setO((prev) => ({
      ...prev,
      periodeId: id || undefined,
      // La période propose l'aire et des bornes, sans écraser ce qui a déjà été saisi.
      aireId: prev.aireId ?? p?.aireId,
      debut: prev.debut ?? p?.debut,
      fin: prev.fin ?? p?.fin,
    }));
  };

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!o.titre.trim()) return;
    enregistrer({
      ...o,
      titre: o.titre.trim(),
      etiquettes: etiquettes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const champ = (cle: 'site' | 'materiau' | 'conservation' | 'style', libelle: string, aide?: string) => (
    <label>
      {libelle}
      <input value={o[cle]} placeholder={aide} onChange={(e) => maj(cle, e.target.value)} />
    </label>
  );

  const zone = (cle: 'iconographie' | 'notes' | 'bibliographie', libelle: string) => (
    <label>
      {libelle}
      <textarea rows={3} value={o[cle]} onChange={(e) => maj(cle, e.target.value)} />
    </label>
  );

  return (
    <form className="formulaire panneau" onSubmit={soumettre}>
      <label>
        Titre *
        <input required autoFocus value={o.titre} placeholder="Bouddha prêchant de Sarnath" onChange={(e) => maj('titre', e.target.value)} />
      </label>

      <div className="deux-colonnes">
        <label>
          Période
          <select value={o.periodeId ?? ''} onChange={(e) => choisirPeriode(e.target.value)}>
            <option value="">—</option>
            {AIRES.map((a) => (
              <optgroup key={a.id} label={a.nom}>
                {PERIODES.filter((p) => p.aireId === a.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({formatAnnee(p.debut)} – {formatAnnee(p.fin)})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Aire culturelle
          <select value={o.aireId ?? ''} onChange={(e) => maj('aireId', e.target.value || undefined)}>
            <option value="">—</option>
            {AIRES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Datation
        <input value={o.datation} placeholder="Ve s. apr. J.-C." onChange={(e) => maj('datation', e.target.value)} />
      </label>
      <div className="deux-colonnes">
        <label>
          De (année)
          <input inputMode="numeric" value={o.debut ?? ''} placeholder="-185 pour av. J.-C." onChange={(e) => maj('debut', nombre(e.target.value))} />
        </label>
        <label>
          À (année)
          <input inputMode="numeric" value={o.fin ?? ''} onChange={(e) => maj('fin', nombre(e.target.value))} />
        </label>
      </div>

      {champ('site', 'Site / provenance', 'Sarnath, Uttar Pradesh')}
      <label>
        Coordonnées du site (latitude, longitude)
        <input
          inputMode="decimal"
          defaultValue={o.lat !== undefined && o.lng !== undefined ? `${o.lat}, ${o.lng}` : ''}
          placeholder="20.024, 75.179 (pour la carte)"
          onChange={(e) => {
            const m = /^\s*(-?\d+(?:[.]\d+)?)\s*[,; ]\s*(-?\d+(?:[.]\d+)?)\s*$/.exec(e.target.value);
            const lat = m ? Number(m[1]) : undefined;
            const lng = m ? Number(m[2]) : undefined;
            const valides = lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
            setO((p) => ({ ...p, lat: valides ? lat : undefined, lng: valides ? lng : undefined }));
          }}
        />
      </label>
      {champ('materiau', 'Matériau et technique', 'Grès de Chunar')}
      {champ('conservation', 'Lieu de conservation', 'Musée Guimet, Paris (MG …)')}
      {champ('style', 'Style', 'École de Sarnath')}
      {zone('iconographie', 'Iconographie')}
      {zone('notes', 'Notes / points à retenir')}
      {zone('bibliographie', 'Bibliographie')}
      <label>
        Étiquettes (séparées par des virgules)
        <input value={etiquettes} placeholder="bouddhisme, sculpture, Guimet" onChange={(e) => setEtiquettes(e.target.value)} />
      </label>

      <label>
        Mots-clés pour chercher des images
        <input value={o.requeteImage ?? ''} placeholder="Titre et site par défaut (l’anglais donne plus de résultats)" onChange={(e) => maj('requeteImage', e.target.value || undefined)} />
      </label>

      <div className="actions">
        <button type="button" className="bouton" onClick={annuler}>
          Annuler
        </button>
        <button type="submit" className="bouton principal">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
