# Données de test

- `base-v4.json`, `base-v5.json` : bases IndexedDB réelles créées avec d'anciennes versions publiées de l'appli
  (`generer-base-ancienne.mjs`), pour vérifier qu'une mise à jour ne perd aucune donnée.
- `expose-fr.webm` : exposé de 17 s en français (texte : `expose-fr.txt`), synthétisé avec Piper
  (voix `fr_FR-siwis-medium`, entraînée sur le corpus SIWIS, licence CC BY 4.0), encodé en Opus comme un
  enregistrement du navigateur. Sert au test de transcription.
