# MadameLaDocteure ✦

Application mobile **personnelle** de préparation au concours de **conservateur du patrimoine (État)**,
spécialité archéologie, option « Archéologie, histoire de l'art et des civilisations de l'Inde et du monde
indianisé ». Session visée : 2027.

Même stack que JeSuisCoach : **TypeScript**, React et Vite, empaquetée pour Android avec **Capacitor**.
Toutes les données restent sur le téléphone (IndexedDB), images comprises, pour réviser hors ligne.

## Fonctionnalités (version actuelle)

### Menu
Organisé en sections dépliables : **Exercices** (identifier les œuvres, comparer, glossaire en cartes, quiz libre, quiz de repères),
**Mode examen** (sujets blancs, plan en 15 minutes, copies et corrections, banque de sujets, vocabulaire anglais),
**Ressources** (œuvres de référence, comparaisons, glossaire, frise chronologique, carte des sites), **Aide**, **Réglages**, **Bientôt** ; l'écran affiché est mis en évidence.

### Accueil
- « Bonjour … » avec le prénom choisi, et un compte à rebours jusqu'aux écrits (date réglable, estimée au 1er juillet 2027)
- **Toutes les aires** : tuiles colorées (Inde du Nord, Inde du Sud, Gandhāra, Bengale, Sri Lanka, Cambodge, Champa,
  Java, Birmanie et Thaïlande, Himalaya) avec le nombre de fiches de chacune
- **Tes dernières fiches**, avec la part de chaque fiche déjà remplie
- **Couverture du programme** : nombre de périodes ayant au moins une fiche
- Thème **clair**, **sombre** ou **automatique** (comme le téléphone), dans le menu

### Révision « identifie cette œuvre »
- Cartes tirées des fiches illustrées : **identifier** (photo, puis réponse et auto-évaluation : à revoir, difficile, bien, facile)
  puis, à partir du lendemain, des **variantes** : **dater** (QCM de période, leurres de la même aire et d'époques proches),
  **retrouver le site** (QCM), **trouver le musée** (QCM, œuvres conservées dans un musée) et **décrire l'iconographie**
  (auto-évaluation, avec le vocabulaire du glossaire)
- **Comparaisons** : 15 paires d'œuvres (`src/data/comparaisons.ts`) — Gandhāra ou Mathurā, Angkor Vat ou Bayon, nāgara ou
  drāviḍa… — révisées côte à côte puis avec le tableau des critères ; page **Comparaisons** et lien « À comparer avec » sur les fiches
- **Répétition espacée** (variante simplifiée de SM-2) : intervalles croissants, carte ratée repassée dans la séance,
  œuvre « maîtrisée » au-delà de 21 jours ; une seule carte par œuvre et par séance ; variantes proposées à partir du
  lendemain de la première identification (5 au plus par séance)
- Séance du jour : cartes dues + 0, 5, 10 ou 20 nouvelles œuvres, filtre par aire ; bilan en fin de séance
- **Quiz libre** : série de QCM (mélange, période, site, musée, termes du glossaire), 10 à 30 questions, filtre par aire,
  corrigés tout de suite sans modifier le calendrier de révision ; score final et « Refaire mes erreurs »
- Carte « Révision du jour » sur l'accueil

### Glossaire iconographique
- **110 termes** (`src/data/glossaire.ts`) : gestes (mudrā), postures et signes du Bouddha, attributs, divinités et figures,
  montures, architecture, notions et techniques ; chaque terme renvoie aux fiches où on l'observe
- Page **Glossaire** : recherche sans accents, filtre par catégorie ; bloc **Vocabulaire à connaître** sur chaque fiche
- **Révision** (onglet Glossaire) : terme → définition (auto-évaluation), puis à partir du surlendemain définition → terme
  (QCM de quatre termes de la même catégorie), même répétition espacée que pour les œuvres

### Repères chronologiques et géographiques
- **Frise chronologique** : une ligne par aire, périodes en barres (sans chevauchement), œuvres des fiches en points ;
  défilement, zoom, raccourcis Antiquité / Médiéval / Moderne ; détail d'une période (fiches, périodes contemporaines ailleurs)
- **Carte des sites** (Leaflet, fonds Esri et OpenStreetMap sans clé, avec bascule automatique, chargée à la demande) : coordonnées de 48 fiches préparées,
  un point par lieu coloré selon l'aire, bulle avec liens vers les fiches ; coordonnées modifiables dans le formulaire
- **Quiz de repères** : 28 questions de dynasties choisies à la main (« Quelle période au Xe siècle au Cambodge ? »)
  et « Place … sur la carte » sur un fond sans noms (réussi à moins de 200 km)

### Mode examen
- **Sujets blancs chronométrés** : dissertation de spécialité, culture générale, note de synthèse ; écriture dans l'appli
  (sauvegarde automatique) ou sur papier (photos des pages) ; chronomètre calculé depuis l'heure de début (survit aux
  rechargements) ; durées réglables, à aligner sur l'arrêté 2027
- **Plan en 15 minutes** : problématique et plan détaillé, commentés par l'IA avec un plan de comparaison
- **Correction par l'IA** (`src/lib/ia.ts`) : grille de critères par épreuve, note indicative sur 20, points forts,
  à améliorer, conseils ; copies tapées ou photographiées ; complète la correction par un pair, sans la remplacer
- **Banque de sujets** : 27 sujets d'entraînement proposés (`src/data/sujets.ts`, pas des sujets tombés), sujets des
  rapports de jury ajoutés à la main, sujets générés par l'IA
- **Vocabulaire anglais** (`src/data/anglais.ts`) : 76 mots d'histoire de l'art, de musée et de patrimoine, faux amis
  compris, révisés comme le glossaire
- **IA** : API Claude (Claude Opus 5.5, sorties structurées vérifiées, repli automatique en cas de refus), avec la clé
  d'API personnelle stockée sur l'appareil et un accord explicite sur les données envoyées (comme JeSuisCoach)

### Fiches préparées
- **51 fiches d'œuvres de référence** installées au premier lancement, de l'Indus à l'art moderne, de l'Inde à Java
  (`src/data/references.ts`) : datation, site, matériau, lieu de conservation, iconographie, points à retenir, étiquettes
- Contenu de départ **à vérifier** avec le programme et les manuels (badge « Fiche préparée » ; datations débattues signalées)
- Modifiables et supprimables comme les autres ; une fiche supprimée n'est pas réinstallée,
  mais le menu permet de **restaurer les fiches préparées supprimées**
- **Photo de l'œuvre elle-même** pour 50 fiches : fichier Wikimedia Commons choisi à la main et vérifié d'après sa
  description (souvent le cartel du musée), téléchargé automatiquement au premier lancement avec auteur et licence
- Corrections apportées aux fiches préparées : appliquées automatiquement aux fiches **non modifiées** ;
  une fiche modifiée à la main n'est jamais écrasée

### Œuvres réelles des musées
- Recherche dans les bases ouvertes du **Cleveland Museum of Art**, du **Metropolitan Museum of Art** et de
  l'**Art Institute of Chicago** (API sans clé, données et images CC0)
- **Notice officielle** : inventaire, datation, culture, matériau, dimensions, acquisition, texte du musée,
  provenance et bibliographie (Cleveland, Chicago) ; lien vers la notice en ligne
- Joindre une notice (et son image) à une fiche comme **œuvre comparable**, ou **créer une fiche** à partir d'une œuvre de musée
- Images : enregistrées sur l'appareil quand le musée le permet (Chicago), sinon affichées en ligne (Cleveland, Met)

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
1. Démarches et plan de préparation (inscriptions, Prépa Talents, lectures) avec rappels
2. Suivi de bibliographie
3. Simulateur d'oral (30 min de préparation et 30 min d'épreuve, jury joué par l'IA)
4. Projection : couverture, mémorisation, notes des sujets blancs, rythme

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
