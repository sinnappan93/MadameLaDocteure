# MadameLaDocteure ✦

Application mobile **personnelle** de préparation au concours de **conservateur du patrimoine (État)**,
spécialité archéologie, option « Archéologie, histoire de l'art et des civilisations de l'Inde et du monde
indianisé ». Session visée : 2027.

Même stack que JeSuisCoach : **TypeScript**, React et Vite, empaquetée pour Android avec **Capacitor**.
Toutes les données restent sur le téléphone (IndexedDB), images comprises, pour réviser hors ligne.

## Fonctionnalités (version actuelle)

### Accueil
- « Bonjour … » avec le prénom choisi, et un compte à rebours jusqu'aux écrits (date réglable, estimée au 1er juillet 2027)
- **Toutes les aires** : tuiles colorées (Inde du Nord, Inde du Sud, Gandhāra, Bengale, Sri Lanka, Cambodge, Champa,
  Java, Birmanie et Thaïlande, Himalaya) avec le nombre de fiches de chacune
- **Tes dernières fiches**, avec la part de chaque fiche déjà remplie
- **Couverture du programme** : nombre de périodes ayant au moins une fiche
- Thème **clair**, **sombre** ou **automatique** (comme le téléphone), dans le menu

### Fiches œuvres
- Titre, datation (libre et en années pour le tri), période, aire, site, matériau, lieu de conservation,
  iconographie, style, points à retenir, bibliographie, étiquettes
- Catalogue de départ de **32 périodes** classées par aire (Maurya, Kushān, Gupta, Pallava, Chola, Angkorien,
  Java central…), avec des bornes indicatives à affiner selon le programme
- Recherche plein texte (sans tenir compte des accents) et filtre par aire

### Images
- **Recherche sur le net** dans Wikimedia Commons (images libres de droits), lancée avec le titre et le site de l'œuvre.
  L'image est téléchargée sur le téléphone avec son **auteur, sa licence et un lien vers la source**.
- **Adresse web** : importer une image à partir de son adresse
- **Photo** : prendre une photo (au musée, dans un catalogue) ou en choisir une dans la galerie
- Images réduites à 1 600 px de côté au maximum ; choix de l'image de couverture

## Feuille de route
1. Révision « identifie cette œuvre » et glossaire iconographique, avec **répétition espacée**
2. Démarches et plan de préparation (inscriptions, Prépa Talents, lectures) avec rappels
3. Suivi de bibliographie
4. Frise chronologique et carte des sites
5. Sujets blancs chronométrés et correction par l'IA
6. Simulateur d'oral (30 min de préparation et 30 min d'épreuve, jury joué par l'IA)
7. Projection : couverture, mémorisation, notes des sujets blancs, rythme

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run typecheck
npm run build
```

## Version web (GitHub Pages)

À chaque `push` sur `main`, le flux **Site web (GitHub Pages)** (`.github/workflows/pages.yml`) vérifie les types et les tests,
construit l'application et la publie sur GitHub Pages : https://sinnappan93.github.io/MadameLaDocteure/
(à activer une fois dans *Settings › Pages › Source : GitHub Actions*). Les données restent dans le navigateur
de chaque appareil : rien n'est envoyé au serveur.

## Application Android (APK)

> Flux désactivé pour l'instant : l'APK sera construit plus tard.


À chaque `push`, le flux GitHub Actions **APK Android** (`.github/workflows/android.yml`) vérifie les types et les tests,
compile l'APK et le publie dans la release **`apk-latest`** du dépôt. Sur le téléphone : télécharger
`MadameLaDocteure.apk` depuis la page *Releases*, l'ouvrir et autoriser l'installation depuis cette source.
Les mises à jour s'installent par-dessus sans perdre les données (clé de signature de test fixe, `android/app/debug.keystore`).

Construction locale (SDK Android et JDK 21 requis) :

```bash
npm run android:apk   # APK dans android/app/build/outputs/apk/debug/
```

## Architecture

```
src/
├── domain/              # Logique pure, testée
│   ├── types.ts         # Œuvre, image (avec crédits)
│   ├── catalogue.ts     # Aires culturelles et périodes
│   ├── commons.ts       # Recherche Wikimedia Commons et lecture des réponses
│   └── progression.ts   # Complétude des fiches, couverture, compte à rebours
├── lib/
│   ├── db.ts            # Base IndexedDB (Dexie) : œuvres, images, fichiers
│   ├── images.ts        # Téléchargement et réduction des images
│   ├── reglages.ts      # Prénom, thème, date des écrits
│   └── useLive.ts       # Requêtes mises à jour en direct
└── components/          # Accueil, menu, liste, fiche, formulaire, ajout d'image
```
