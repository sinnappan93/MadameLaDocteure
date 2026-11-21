import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

/** Résultat d'une requête Dexie, mis à jour automatiquement quand les données changent. */
export function useLive<T>(requete: () => Promise<T>, deps: unknown[]): T | undefined {
  const [valeur, setValeur] = useState<T>();
  useEffect(() => {
    const abonnement = liveQuery(requete).subscribe({ next: setValeur, error: console.error });
    return () => abonnement.unsubscribe();
  }, deps);
  return valeur;
}

/** Adresse locale (blob:) d'un fichier stocké, libérée automatiquement. */
export function useUrlFichier(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
