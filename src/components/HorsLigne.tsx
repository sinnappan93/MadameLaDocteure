import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Vrai quand l'appareil a du réseau. */
export function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const maj = () => setEnLigne(navigator.onLine);
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    return () => {
      window.removeEventListener('online', maj);
      window.removeEventListener('offline', maj);
    };
  }, []);
  return enLigne;
}

/** Pastille de l'en-tête quand il n'y a pas de réseau. */
export function PastilleHorsLigne() {
  const enLigne = useEnLigne();
  if (enLigne) return null;
  return (
    <span className="pastille-hors-ligne" role="status" title="Pas de réseau : l’IA, les musées et les nouvelles images ne sont pas disponibles.">
      Hors ligne
    </span>
  );
}

const UNE_HEURE = 60 * 60 * 1000;

/**
 * Service worker de la version web : l'appli reste disponible hors ligne. Une nouvelle version n'est installée
 * que sur demande, pour ne jamais recharger la page en plein sujet blanc ou en plein oral.
 */
export function MiseAJour() {
  const {
    offlineReady: [pret, setPret],
    needRefresh: [nouvelle, setNouvelle],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, enregistrement) {
      if (enregistrement) setInterval(() => enregistrement.update().catch(() => undefined), UNE_HEURE);
    },
  });
  useEffect(() => {
    if (!pret) return;
    const t = setTimeout(() => setPret(false), 6000);
    return () => clearTimeout(t);
  }, [pret]);
  if (nouvelle)
    return (
      <div className="bandeau-maj" role="status">
        <span>Une nouvelle version de l’appli est prête.</span>
        <button className="bouton petit" onClick={() => setNouvelle(false)}>
          Plus tard
        </button>
        <button className="bouton principal petit" onClick={() => updateServiceWorker(true)}>
          Mettre à jour
        </button>
      </div>
    );
  if (pret)
    return (
      <div className="bandeau-maj" role="status">
        <span>L’appli fonctionne maintenant hors ligne.</span>
        <button className="bouton petit" onClick={() => setPret(false)}>
          OK
        </button>
      </div>
    );
  return null;
}
