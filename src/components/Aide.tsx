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
            <strong>Compte à rebours</strong> : le nombre de jours avant les écrits. La date est une estimation (1er juillet 2027) : corrige-la dans le menu quand
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
            Depuis l’accueil (<em>Révision du jour</em>) ou le menu › <em>Révision</em>. Seules les fiches avec une image sont révisées.
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
            comparaisons sont aussi consultables dans Menu › <em>Comparaisons</em>, et chaque fiche concernée affiche <em>À comparer avec</em>.
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

      <Rubrique titre="Le glossaire">
        <ul>
          <li>
            Menu › <em>Glossaire</em> : {GLOSSAIRE.length} termes d’iconographie et d’architecture (gestes, postures, attributs, divinités, montures,
            architecture, notions), avec recherche sans accents et filtre par catégorie. Chaque terme renvoie aux fiches où on le voit.
          </li>
          <li>
            Sur chaque fiche, <em>Vocabulaire à connaître</em> rappelle les termes utiles pour la décrire.
          </li>
          <li>
            <strong>Réviser</strong> : menu › <em>Révision</em> › onglet <em>Glossaire</em>. D’abord le terme, dont tu retrouves la définition (auto-évaluation) ;
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
            <strong>Consulter</strong> : depuis l’accueil ou <em>Œuvres de référence</em> dans le menu. La recherche fonctionne sans accents (titre, site, dynastie,
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
            Une fiche préparée supprimée ne revient pas. Pour la récupérer : menu › <em>Restaurer les fiches préparées supprimées</em>.
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
        <p>Démarches et plan de préparation, bibliographie, frise et carte, sujets blancs, simulateur d’oral.</p>
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
