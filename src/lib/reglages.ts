import { useEffect, useState } from 'react';

/** Réglages personnels, gardés sur l'appareil. */
export type Theme = 'auto' | 'clair' | 'sombre';

export interface Reglages {
  prenom: string;
  theme: Theme;
  /** Date estimée des écrits (AAAA-MM-JJ), à corriger quand l'arrêté d'ouverture 2027 sera publié. */
  dateEcrits: string;
}

const CLE = 'madameladocteure:reglages';
const DEFAUT: Reglages = { prenom: '', theme: 'auto', dateEcrits: '2027-07-01' };

function lire(): Reglages {
  try {
    return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) ?? '{}') };
  } catch {
    return DEFAUT;
  }
}

export function useReglages(): [Reglages, (changements: Partial<Reglages>) => void] {
  const [reglages, setReglages] = useState(lire);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(reglages));
    } catch {
      /* stockage indisponible : les réglages valent pour la session */
    }
    const html = document.documentElement;
    if (reglages.theme === 'auto') delete html.dataset.theme;
    else html.dataset.theme = reglages.theme;
  }, [reglages]);

  return [reglages, (c) => setReglages((r) => ({ ...r, ...c }))];
}
