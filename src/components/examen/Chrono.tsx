import { useEffect, useState } from 'react';
import { formatChrono, secondesRestantes } from '../../domain/examen';

/** Secondes restantes, mises à jour chaque seconde (calculées depuis le début enregistré). */
export function useChrono(debut: string, dureeMin: number, arrete = false): number {
  const [restant, setRestant] = useState(() => secondesRestantes(debut, dureeMin));
  useEffect(() => {
    // Recalcul immédiat quand la copie est chargée (sinon la valeur provisoire reste affichée une seconde).
    setRestant(secondesRestantes(debut, dureeMin));
    if (arrete) return;
    const t = setInterval(() => setRestant(secondesRestantes(debut, dureeMin)), 1000);
    return () => clearInterval(t);
  }, [debut, dureeMin, arrete]);
  return restant;
}

/** Bandeau du chronomètre, fixé en haut pendant l'épreuve. */
export function BandeauChrono({ restant, dureeMin }: { restant: number; dureeMin: number }) {
  const ecoule = 1 - Math.max(0, restant) / (dureeMin * 60);
  const etat = restant < 0 ? 'depasse' : restant < 15 * 60 && dureeMin > 30 ? 'fin-proche' : restant < 3 * 60 ? 'fin-proche' : '';
  return (
    <div className={`bandeau-chrono ${etat}`} role="timer" aria-live="off">
      <span className="chrono-valeur">{formatChrono(restant)}</span>
      <span className="barre">
        <span style={{ width: `${Math.min(100, ecoule * 100)}%` }} />
      </span>
      <span className="chrono-etat">{restant < 0 ? 'Temps dépassé' : 'restant'}</span>
    </div>
  );
}
