/**
 * Recherche d'images sur Wikimedia Commons (API MediaWiki, sans clé, CORS ouvert avec `origin=*`).
 * Commons contient beaucoup d'œuvres indiennes et d'Asie du Sud-Est sous licence libre, avec auteur et licence :
 * on conserve ces crédits avec chaque image importée.
 */

export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** Largeur des vignettes de la grille de résultats, et de l'image enregistrée sur l'appareil. */
export const LARGEUR_VIGNETTE = 330;
export const LARGEUR_IMPORT = 1280;

export interface ResultatCommons {
  /** Nom du fichier sur Commons (« File:… »). */
  fichier: string;
  titre: string;
  vignette: string;
  /** Image à télécharger (taille réduite si l'original est plus grand que LARGEUR_IMPORT). */
  urlImport: string;
  largeur: number;
  hauteur: number;
  auteur?: string;
  licence?: string;
  description?: string;
  pageOrigine: string;
}

export interface PageResultats {
  resultats: ResultatCommons[];
  /** Décalage à passer pour la page suivante, absent s'il n'y en a plus. */
  suite?: number;
}

export function urlRecherche(requete: string, decalage = 0, parPage = 24): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrsearch: `${requete.trim()} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(parPage),
    gsroffset: String(decalage),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(LARGEUR_VIGNETTE),
    iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription|ObjectName',
  });
  return `${COMMONS_API}?${params}`;
}

/** Retire les balises HTML et les espaces superflus des métadonnées Commons. */
export function texteBrut(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const texte = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return texte || undefined;
}

/**
 * Adresse d'une version réduite : les vignettes Commons suivent le motif `.../thumb/x/xy/Nom.jpg/330px-Nom.jpg`,
 * il suffit de changer la largeur. Si l'original est plus petit, on prend l'original.
 */
export function urlRedimensionnee(vignette: string, original: string, largeurOriginale: number, largeur: number): string {
  if (largeurOriginale <= largeur) return original;
  const remplacee = vignette.replace(/\/\d+px-([^/]+)$/, `/${largeur}px-$1`);
  return remplacee === vignette ? original : remplacee;
}

interface MetaCommons {
  value?: string;
}

interface ReponseCommons {
  continue?: { gsroffset?: number };
  query?: {
    pages?: Array<{
      title: string;
      index?: number;
      imageinfo?: Array<{
        url: string;
        descriptionurl: string;
        thumburl?: string;
        width: number;
        height: number;
        mime?: string;
        extmetadata?: Record<string, MetaCommons | undefined>;
      }>;
    }>;
  };
}

export function lireReponse(json: unknown): PageResultats {
  const rep = json as ReponseCommons;
  const pages = [...(rep.query?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const resultats: ResultatCommons[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || (info.mime && !info.mime.startsWith('image/'))) continue;
    const meta = info.extmetadata ?? {};
    const vignette = info.thumburl ?? info.url;
    resultats.push({
      fichier: page.title,
      titre: texteBrut(meta.ObjectName?.value) ?? page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
      vignette,
      urlImport: urlRedimensionnee(vignette, info.url, info.width, LARGEUR_IMPORT),
      largeur: info.width,
      hauteur: info.height,
      auteur: texteBrut(meta.Artist?.value),
      licence: texteBrut(meta.LicenseShortName?.value),
      description: texteBrut(meta.ImageDescription?.value),
      pageOrigine: info.descriptionurl,
    });
  }
  return { resultats, suite: rep.continue?.gsroffset };
}

/** Informations (adresse, crédits) sur des fichiers précis, au plus 50 par requête. */
export function urlInfosFichiers(fichiers: string[]): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    titles: fichiers.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(LARGEUR_VIGNETTE),
    iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription|ObjectName',
  });
  return `${COMMONS_API}?${params}`;
}

/** Lit la réponse d'`urlInfosFichiers` en tenant compte des titres normalisés par Commons. */
export function lireInfosFichiers(json: unknown): Map<string, ResultatCommons> {
  const rep = json as { query?: { normalized?: Array<{ from: string; to: string }> } };
  const versDemande = new Map((rep.query?.normalized ?? []).map((n) => [n.to, n.from]));
  const carte = new Map<string, ResultatCommons>();
  for (const r of lireReponse(json).resultats) {
    carte.set(r.fichier, r);
    const demande = versDemande.get(r.fichier);
    if (demande) carte.set(demande, r);
  }
  return carte;
}

export async function rechercherCommons(requete: string, decalage = 0, signal?: AbortSignal): Promise<PageResultats> {
  const reponse = await fetch(urlRecherche(requete, decalage), { signal });
  if (!reponse.ok) throw new Error(`Wikimedia Commons a répondu ${reponse.status}`);
  return lireReponse(await reponse.json());
}
