import { GLOSSAIRE } from '../data/glossaire';
import { REFERENCES } from '../data/references';
import { AIRES, PERIODES } from '../domain/catalogue';

/** Page « Comment m'utiliser ? » : mode d'emploi de l'application, rubrique par rubrique. */
export function Aide() {
  return (
    <section className="panneau aide">
      <p className="aide-intro">
        MadameLaDocteure t’aide à préparer le concours de conservateur du patrimoine, option Inde et monde indianisé. Pour l’instant, l’appli sert à
        constituer et réviser un corpus d’<strong>œuvres de référence</strong>. Touche une rubrique pour l’ouvrir.
      </p>

      <Rubrique titre="L’accueil" ouverte>
        <ul>
          <li>
            <strong>Compte à rebours</strong> : le nombre de jours avant les écrits. La date est une estimation (1er juillet 2027) : corrige-la dans Menu › <em>Réglages</em> quand
            l’arrêté d’ouverture sera publié.
          </li>
          <li>
            <strong>Toutes les aires</strong> : une tuile par aire culturelle, avec son nombre de fiches. Touche une tuile pour voir ses fiches,{' '}
            <em>Tout voir</em> pour la liste complète.
          </li>
          <li>
            <strong>Tes dernières fiches</strong> : les fiches modifiées récemment, avec la part déjà remplie (barre orange).
          </li>
          <li>
            <strong>Couverture du programme</strong> : combien de périodes ont au moins une fiche. Une bonne façon de repérer tes lacunes.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="La révision « identifie cette œuvre »">
        <ul>
          <li>
            Depuis l’accueil (<em>Révision du jour</em>) ou Menu › <em>Exercices</em> › <em>Identifier les œuvres</em>. Seules les fiches avec une image sont révisées.
          </li>
          <li>
            <strong>Identifier</strong> : l’appli montre la photo. Cherche le titre, la datation, le lieu et le style, puis touche <em>Voir la réponse</em> et
            note-toi honnêtement : <em>À revoir</em>, <em>Difficile</em>, <em>Bien</em> ou <em>Facile</em>.
          </li>
          <li>
            <strong>Variantes</strong>, à partir du lendemain de la première identification (cinq au plus par séance) : <em>dater</em> (QCM de période),{' '}
            <em>retrouver le site</em> (QCM), <em>trouver le musée</em> (QCM, seulement pour les œuvres conservées dans un musée) et <em>décrire
            l’iconographie</em> (auto-évaluation, avec le vocabulaire à employer).
          </li>
          <li>
            <strong>Comparer</strong> (onglet de la révision) : deux œuvres côte à côte, à identifier et à distinguer, puis le tableau des critères. Toutes les
            comparaisons sont aussi consultables dans Menu › <em>Ressources</em> › <em>Comparaisons</em>, et chaque fiche concernée affiche <em>À comparer avec</em>.
          </li>
          <li>
            <strong>Répétition espacée</strong> : une carte réussie revient de plus en plus tard (1 jour, 3 jours, une semaine, un mois…) ; une carte ratée
            revient dans la même séance puis le lendemain. Une œuvre est « maîtrisée » quand elle ne revient pas avant 3 semaines.
          </li>
          <li>
            Chaque jour : les cartes à revoir, plus quelques nouvelles œuvres (0, 5, 10 ou 20, à choisir). Tu peux limiter la séance à une aire.
          </li>
          <li>Le plus efficace : une séance courte chaque jour plutôt qu’une longue de temps en temps.</li>
        </ul>
      </Rubrique>

      <Rubrique titre="Le quiz libre">
        <ul>
          <li>
            Menu › <em>Exercices</em> › <em>Quiz libre</em> (ou l’onglet <em>Quiz</em> de la révision) : une série de QCM corrigés tout de suite, sans attendre le
            calendrier de la répétition espacée, et sans le modifier.
          </li>
          <li>
            Au choix : <em>Mélange</em>, <em>Période</em>, <em>Site</em>, <em>Musée</em> ou <em>Termes</em> du glossaire ; filtre par aire ; 10, 20 ou 30 questions.
          </li>
          <li>
            À la fin : ton score et la liste des réponses ; <em>Refaire mes erreurs</em> relance un quiz avec les seules questions ratées.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Plan de révision et calendrier">
        <ul>
          <li>
            Menu › <em>Préparation</em> › <em>Plan de révision</em>. Indique tes dates (écrits, résultats d’admissibilité, oraux : des estimations à corriger
            quand le calendrier officiel sort), tes jours de travail, ton temps par jour et les jours où tu as une longue plage. Ajoute tes démarches (inscription,
            Prépa Talents…) : elles apparaissent comme jalons ★.
          </li>
          <li>
            Le plan suit la logique de JeSuisCoach : <strong>travail de fond</strong> avec une charge qui augmente et une semaine plus légère toutes les 4 semaines,
            <strong> affûtage</strong> les 5 dernières semaines avant les écrits (un sujet blanc par semaine longue, plus de nouvelles lectures, repos la veille),
            une semaine de pause, puis <strong>bascule sur l’oral</strong> (oraux blancs, mises en situation, anglais) après l’admissibilité.
          </li>
          <li>
            Chaque jour commence par la révision espacée, centrée sur tes aires les plus faibles. Les autres séances (lecture, fiches, glossaire, comparaisons,
            repères, plans en 15 minutes, anglais) sont dosées selon les <strong>lacunes mesurées</strong> : œuvres jamais révisées, erreurs, périodes sans fiche,
            glossaire, notes des copies et des oraux. Le détail est dans « Ce que l’appli a mesuré ».
          </li>
          <li>
            <strong>Commencer</strong> ouvre le bon écran (avec l’aire ou l’épreuve choisie). Coche les séances faites ; l’appli coche aussi d’elle-même celles
            qu’elle voit (révisions du jour, copie rendue, oral, visite, pages notées).
          </li>
          <li>
            Vue <em>Semaine</em> ou <em>Mois</em>. <em>Recalculer avec mes lacunes</em> refait les séances à venir en gardant le passé et ce qui est fait. Le calendrier
            du mois est aussi sur l’accueil : touche un jour pour voir ses séances.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Projection">
        <ul>
          <li>
            Menu › <em>Préparation</em> › <em>Projection</em> : des <strong>repères</strong>, pas des notes garanties. « Prêt pour l’écrit » et « Prêt pour
            l’oral », puis un indicateur par épreuve (touche-le pour voir de quoi il est fait). Ce qui ne se mesure pas encore (pas de copie notée, pas d’oral)
            est laissé de côté et l’indicateur est marqué « incomplet ». L’essentiel (prêt pour l’écrit et l’oral, couverture, dates estimées) est aussi sur l’accueil.
          </li>
          <li>
            <strong>Couverture</strong> : une période est couverte quand au moins 2 de ses œuvres sont maîtrisées (révisées avec succès sur plus de 3 semaines),
            aire par aire, avec les fiches qui manquent.
          </li>
          <li>
            <strong>Mémorisation</strong> : œuvres maîtrisées, bonnes réponses, glossaire et anglais, cartes en retard.
          </li>
          <li>
            <strong>Notes</strong> des sujets blancs et leur évolution : la note d’un correcteur (à ajouter sur la copie, ou pour un sujet fait hors de l’appli)
            prime sur celle de l’IA.
          </li>
          <li>
            <strong>Rythme</strong> : temps fait par rapport au plan, et date à laquelle tu couvriras l’Inde et l’Asie du Sud-Est au rythme des 4 dernières
            semaines. L’appli prend chaque jour une photo de ta progression : la date apparaît après une semaine de recul.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Bibliographie">
        <ul>
          <li>
            Menu › <em>Préparation</em> › <em>Bibliographie</em> : livres, catalogues, articles, rapports de jury. Pars des suggestions (à compléter et vérifier :
            édition, pages) ou ajoute les tiens.
          </li>
          <li>
            Dans une lecture : <em>J’ai lu jusqu’à la page…</em> suit l’avancement, les notes sont enregistrées automatiquement, et tu relies les œuvres citées à tes
            fiches (la fiche affiche alors « Citée dans »). Les lectures en cours sont reprises dans le plan.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Journal de visites">
        <ul>
          <li>
            Menu › <em>Préparation</em> › <em>Journal de visites</em>, ou <em>Commencer</em> sur une visite du plan (les sections proposées correspondent à tes aires
            faibles). Note la date, les salles vues et tes impressions.
          </li>
          <li>
            <strong>📷 Photographier une œuvre</strong> : la photo, celle du cartel si tu veux, le titre, la datation et le n° d’inventaire suffisent à créer une
            fiche (conservation : le musée), à compléter ensuite. Elle entre dans tes révisions.
          </li>
          <li>« À revoir sur place » liste tes fiches conservées au Guimet dans les salles cochées.</li>
        </ul>
      </Rubrique>

      <Rubrique titre="Mode examen">
        <ul>
          <li>
            <strong>Sujets blancs</strong> (Menu › <em>Mode examen</em>) : choisis l’épreuve (spécialité, culture générale, note de synthèse), un sujet (au hasard
            ou dans la liste), la durée, et écris <em>dans l’appli</em> (sauvegarde automatique) ou <em>sur papier</em>. Le chronomètre continue même si tu fermes
            l’appli. À la fin, <em>Rendre la copie</em> ; pour une copie papier, photographie chaque page.
          </li>
          <li>
            <strong>Plan en 15 minutes</strong> : un sujet au hasard, seulement la problématique et le plan détaillé ; l’IA les commente et propose un plan de
            comparaison (une possibilité parmi d’autres).
          </li>
          <li>
            <strong>Correction par l’IA</strong> (Mes copies et corrections) : grille de critères (problématique, structure, précision des exemples, références
            aux œuvres, expression), note indicative sur 20, points forts, à améliorer, conseils. Elle complète la correction par un pair ou un enseignant, sans
            la remplacer.
          </li>
          <li>
            <strong>Banque de sujets</strong> : des sujets d’entraînement proposés (ce ne sont pas des sujets tombés), les sujets des rapports de jury que tu
            ajoutes, et des sujets générés par l’IA à partir d’un thème.
          </li>
          <li>
            <strong>Vocabulaire anglais</strong> : fiches mémo d’anglais de l’histoire de l’art et du musée (faux amis : <em>curator</em> = conservateur,{' '}
            <em>conservator</em> = restaurateur), avec la même répétition espacée.
          </li>
          <li>
            <strong>Activer l’IA</strong> : Menu › <em>Réglages</em> › <em>Intelligence artificielle</em>. Il faut ta propre clé d’API Anthropic (créée sur
            console.anthropic.com, payante à l’usage : quelques dizaines de centimes par copie) et ton accord pour l’envoi du sujet et de la copie. La clé reste
            sur cet appareil. Sans IA, les sujets blancs, le chronomètre et les copies fonctionnent quand même.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Simulateur d’oral">
        <ul>
          <li>
            Menu › <em>Mode examen</em> › <em>Simulateur d’oral</em>. Choisis un <strong>dossier</strong> : des œuvres tirées de tes fiches (de la même aire et
            d’époques proches si possible, cartels masqués si tu veux t’entraîner à identifier), ou un <strong>thème</strong>, avec des œuvres de tes fiches liées
            au thème.
          </li>
          <li>
            <strong>Format</strong> : 30 min de préparation puis 30 min d’épreuve (fiche de 2015), dont 10 min d’exposé. Tout est réglable : la répartition
            exposé/questions est une hypothèse à vérifier dans l’arrêté et les rapports de jury.
          </li>
          <li>
            <strong>Préparation</strong> : le dossier, le chronomètre et une zone de notes (brouillon) enregistrée automatiquement. Si tu fermes l’appli, reprends
            l’oral depuis la liste « Mes oraux ».
          </li>
          <li>
            <strong>Exposé</strong> : <em>Commencer l’exposé</em> lance l’enregistrement audio (autorise le micro) et le chronomètre de l’épreuve. Un second
            compteur indique le temps d’exposé restant. Garde l’écran allumé.
          </li>
          <li>
            <strong>Questions du jury</strong> : avec l’IA, des relances sur ton exposé (à partir de tes notes, et de la transcription ou de ton résumé), puis des
            questions de motivation et des mises en situation professionnelle (prêt, restauration, acquisition, récolement…). Sans IA, des questions de la
            banque. Chaque réponse est enregistrée ; « Ce qu’attendait le jury » donne les pistes ensuite. 🔊 lit la question à voix haute.
          </li>
          <li>
            <strong>Après l’oral</strong> : réécoute ton exposé et tes réponses, corrige les transcriptions ou écris un résumé, puis demande le{' '}
            <strong>bilan du jury</strong> (note indicative, conseils). L’IA ne peut pas écouter l’audio : elle lit seulement l’écrit.
          </li>
          <li>
            <strong>Transcription</strong> (facultative, Chrome et Safari) : la dictée du navigateur écrit ce que tu dis. Dans Chrome, le son passe par le service de
            Google ; sur certains téléphones, elle ne marche pas pendant l’enregistrement.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Repères : frise, carte et quiz">
        <ul>
          <li>
            Menu › <em>Ressources</em> › <em>Frise chronologique</em> : une ligne par aire, les périodes en barres et tes fiches en points. Fais défiler de côté,
            zoome avec − et +, ou choisis <em>Antiquité</em>, <em>Médiéval</em>, <em>Moderne</em>. Touche une période pour voir ses fiches et ce qui se passe au
            même moment ailleurs ; touche un point pour ouvrir la fiche.
          </li>
          <li>
            Menu › <em>Ressources</em> › <em>Carte des sites</em> : un point par lieu, coloré selon l’aire ; touche-le pour ouvrir la fiche. Pour placer une fiche à
            toi, ajoute ses coordonnées (latitude, longitude) dans <em>Modifier</em>. La carte demande une connexion Internet.
          </li>
          <li>
            Menu › <em>Exercices</em> › <em>Quiz de repères</em> : « Quelle période au IXe siècle au Cambodge ? » (seulement des siècles où une période domine
            nettement) et « Place Ellora sur la carte » (carte sans noms ; réussi à moins de 200 km). Aussi disponibles dans le quiz libre (<em>Dynasties</em>,{' '}
            <em>Carte</em>).
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Le glossaire">
        <ul>
          <li>
            Menu › <em>Ressources</em> › <em>Glossaire</em> : {GLOSSAIRE.length} termes d’iconographie et d’architecture (gestes, postures, attributs, divinités, montures,
            architecture, notions), avec recherche sans accents et filtre par catégorie. Chaque terme renvoie aux fiches où on le voit.
          </li>
          <li>
            Sur chaque fiche, <em>Vocabulaire à connaître</em> rappelle les termes utiles pour la décrire.
          </li>
          <li>
            <strong>Réviser</strong> : Menu › <em>Exercices</em> › <em>Glossaire en cartes</em>. D’abord le terme, dont tu retrouves la définition (auto-évaluation) ;
            les jours suivants, la définition, dont tu retrouves le terme parmi quatre (QCM). Même répétition espacée que pour les œuvres.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Aires et périodes">
        <p>
          Chaque fiche est classée dans une <strong>aire culturelle</strong> (grande zone géographique : Inde du Nord, Cambodge, Java…) et, si possible, une{' '}
          <strong>période</strong> (Maurya, Gupta, Chola, Angkorien…). L’appli compte {AIRES.length} aires et {PERIODES.length} périodes.
        </p>
        <p className="avertissement">
          Ce découpage a été choisi pour démarrer : ce n’est <strong>pas</strong> celui du programme officiel, qui n’est pas encore publié pour 2027. Il pourra
          être aligné sur l’arrêté de programme.
        </p>
      </Rubrique>

      <Rubrique titre="Les fiches d’œuvres">
        <ul>
          <li>
            <strong>Consulter</strong> : depuis l’accueil ou Menu › <em>Ressources</em> › <em>Œuvres de référence</em>. La recherche fonctionne sans accents (titre, site, dynastie,
            étiquette…) et le menu déroulant filtre par aire.
          </li>
          <li>
            <strong>Créer</strong> : bouton orange <em>+</em> en bas à droite de la liste. Seul le titre est obligatoire. Choisir une période remplit
            automatiquement l’aire et les années.
          </li>
          <li>
            <strong>Modifier</strong> ou <strong>supprimer</strong> : boutons en bas de chaque fiche.
          </li>
          <li>
            <strong>Années</strong> : en chiffres, négatifs avant J.-C. (−185 pour 185 av. J.-C.). Elles servent au tri et serviront à la frise chronologique.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre={`Les ${REFERENCES.length} fiches préparées`}>
        <ul>
          <li>
            Installées automatiquement, de l’Indus à l’art moderne, avec photo de l’œuvre et points à retenir. Elles portent la mention{' '}
            <span className="badge-reference">Fiche préparée · à vérifier avec tes sources</span>.
          </li>
          <li>
            <strong>À relire avec tes manuels</strong> avant de les apprendre : c’est un point de départ, pas une source officielle. Les points débattus sont signalés.
          </li>
          <li>
            Quand une correction est publiée, les fiches préparées <strong>que tu n’as pas modifiées</strong> se mettent à jour toutes seules. Une fiche que tu as
            modifiée n’est jamais écrasée.
          </li>
          <li>
            Une fiche préparée supprimée ne revient pas. Pour la récupérer : Menu › <em>Réglages</em> › <em>Restaurer les fiches préparées supprimées</em>.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Les images">
        <ul>
          <li>
            Sur une fiche, touche <em>+</em> sous l’image (ou <em>Trouver une image</em>) :
            <ul>
              <li>
                <strong>Sur le net</strong> : images libres de Wikimedia Commons ; les mots-clés en anglais donnent plus de résultats.
              </li>
              <li>
                <strong>Adresse web</strong> : colle l’adresse d’une image (appui long sur l’image › <em>Copier l’adresse de l’image</em>).
              </li>
              <li>
                <strong>Photo</strong> : prends une photo (au musée, dans un catalogue) ou choisis-en une dans ta galerie.
              </li>
            </ul>
          </li>
          <li>Une fiche peut avoir plusieurs images : touche une miniature, puis <em>Mettre en couverture</em> ou <em>Retirer l’image</em>.</li>
          <li>Sous l’image s’affichent son auteur, sa licence et un lien vers la source.</li>
        </ul>
      </Rubrique>

      <Rubrique titre="Dans les musées">
        <ul>
          <li>
            En bas de chaque fiche, <em>Dans les musées</em> cherche des <strong>œuvres réelles</strong> dans les collections ouvertes du Cleveland Museum of Art, du
            Metropolitan Museum (New York) et de l’Art Institute of Chicago.
          </li>
          <li>
            Chaque résultat ouvre la <strong>notice officielle</strong> du musée : inventaire, datation, matériau, dimensions, provenance, bibliographie, texte du
            conservateur (en anglais).
          </li>
          <li>
            <em>Joindre à la fiche</em> ajoute la notice (et son image) comme œuvre comparable. Depuis la liste, <em>Importer une œuvre d’un musée</em> crée une
            nouvelle fiche à partir d’une notice.
          </li>
          <li>Chercher en anglais : « Nataraja », « Gandhara Buddha », « Khmer Vishnu »… Si un musée ne répond pas, l’appli l’indique et montre les autres.</li>
          <li>Le Musée Guimet et les musées indiens ne publient pas de base ouverte : leurs œuvres ne sont pas dans cette recherche.</li>
        </ul>
      </Rubrique>

      <Rubrique titre="Le menu">
        <ul>
          <li>
            <strong>Exercices</strong> : identifier les œuvres, comparer deux œuvres, glossaire en cartes, quiz libre, quiz de repères.
          </li>
          <li>
            <strong>Préparation</strong> : plan de révision, projection, bibliographie, journal de visites.
          </li>
          <li>
            <strong>Mode examen</strong> : sujets blancs, plan en 15 minutes, copies et corrections, banque de sujets, simulateur d’oral, vocabulaire anglais.
          </li>
          <li>
            <strong>Ressources</strong> : œuvres de référence, comparaisons, glossaire, frise chronologique, carte des sites.
          </li>
          <li>
            <strong>Aide</strong>, <strong>Réglages</strong> et <strong>Bientôt</strong> (fonctions prévues) : touche le titre d’une section pour la déplier.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Réglages (menu)">
        <ul>
          <li>
            <strong>Prénom</strong> : affiché sur l’accueil.
          </li>
          <li>
            <strong>Date des écrits</strong> : règle le compte à rebours.
          </li>
          <li>
            <strong>Thème</strong> : <em>Auto</em> suit le réglage du téléphone, <em>Clair</em> ou <em>Sombre</em> le force.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Tes données">
        <ul>
          <li>
            Tout est enregistré <strong>sur l’appareil</strong>, dans le navigateur : fiches, photos, réglages. Rien n’est envoyé sur un serveur. Les fiches restent
            consultables hors connexion ; la recherche d’images et de musées demande Internet.
          </li>
          <li>
            <strong>Chaque appareil a ses propres données</strong> : une fiche créée sur le téléphone n’apparaît pas sur l’ordinateur.
          </li>
          <li>
            <strong>Attention</strong> : effacer les données du navigateur (ou du site) efface aussi tes fiches.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="L’installer comme une appli">
        <ul>
          <li>
            Sur Android (Chrome) : menu ⋮ › <em>Ajouter à l’écran d’accueil</em>.
          </li>
          <li>
            Sur iPhone (Safari) : bouton de partage › <em>Sur l’écran d’accueil</em>.
          </li>
        </ul>
      </Rubrique>

      <Rubrique titre="Bientôt">
        <p>Rappels des séances (notifications), avec la version APK.</p>
      </Rubrique>
    </section>
  );
}

function Rubrique({ titre, ouverte, children }: { titre: string; ouverte?: boolean; children: React.ReactNode }) {
  return (
    <details className="rubrique" open={ouverte}>
      <summary>{titre}</summary>
      <div className="rubrique-contenu">{children}</div>
    </details>
  );
}
