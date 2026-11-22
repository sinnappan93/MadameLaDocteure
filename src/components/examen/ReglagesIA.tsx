import { useState } from 'react';
import { enregistrerReglagesIA, iaPrete, lireReglagesIA, MODELE_IA } from '../../lib/ia';

/** Réglages de l'IA : clé d'API personnelle (stockée sur l'appareil) et accord sur les données envoyées. */
export function ReglagesIA() {
  const [r, setR] = useState(lireReglagesIA);
  const [visible, setVisible] = useState(false);
  const maj = (c: Partial<typeof r>) => {
    const n = { ...r, ...c };
    setR(n);
    enregistrerReglagesIA(n);
  };
  return (
    <div className="reglages-ia">
      <span className="libelle">Intelligence artificielle (mode examen)</span>
      <p className="discret">
        Correction de copies, commentaire de plans et génération de sujets par Claude ({MODELE_IA}), avec ta propre clé d’API créée sur
        console.anthropic.com. Coût indicatif : quelques dizaines de centimes par copie corrigée.
      </p>
      <label>
        Clé d’API
        <span className="champ-cle">
          <input type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={r.cle} placeholder="sk-ant-…" onChange={(e) => maj({ cle: e.target.value })} />
          <button type="button" className="lien" onClick={() => setVisible((v) => !v)}>
            {visible ? 'Masquer' : 'Afficher'}
          </button>
        </span>
      </label>
      <label className="case">
        <input type="checkbox" checked={r.consentement} onChange={(e) => maj({ consentement: e.target.checked })} />
        <span>
          J’accepte que le sujet et ma copie (texte ou photos), ou mon plan, soient envoyés à Anthropic pour être corrigés. Rien d’autre n’est envoyé ; la clé reste
          sur cet appareil.
        </span>
      </label>
      <p className={`etat-ia ${iaPrete(r) ? 'ok' : ''}`}>{iaPrete(r) ? '✓ IA prête' : 'IA désactivée : clé et accord nécessaires.'}</p>
    </div>
  );
}
