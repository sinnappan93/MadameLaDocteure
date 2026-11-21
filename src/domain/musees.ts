/**
 * Notices d'œuvres réelles issues des bases ouvertes de trois musées (API sans clé, données CC0) :
 * Cleveland Museum of Art, Metropolitan Museum of Art (New York), Art Institute of Chicago.
 * Chaque résultat est ramené à une même forme, la « notice », que l'on peut joindre à une fiche
 * ou utiliser pour en créer une. Les textes restent dans la langue du musée (anglais).
 */
import { texteBrut } from './commons';

export type SourceMusee = 'cleveland' | 'met' | 'aic';

export const MUSEES: Record<SourceMusee, { nom: string; court: string; licenceTexte: string }> = {
  cleveland: { nom: 'Cleveland Museum of Art', court: 'Cleveland', licenceTexte: 'CC0' },
  met: { nom: 'The Metropolitan Museum of Art, New York', court: 'Met', licenceTexte: 'CC0' },
  aic: { nom: 'Art Institute of Chicago', court: 'Chicago', licenceTexte: 'Description CC BY 4.0, données CC0' },
};

export interface NoticeMusee {
  source: SourceMusee;
  /** Identifiant de l'objet dans la base du musée. */
  idMusee: string;
  titre: string;
  datation: string;
  debut?: number;
  fin?: number;
  culture?: string;
  materiau?: string;
  dimensions?: string;
  inventaire: string;
  creditLine?: string;
  description?: string;
  provenance?: string[];
  bibliographie?: string[];
  /** Image libre (domaine public / CC0). */
  image?: string;
  vignette?: string;
  /** Page de l'œuvre sur le site du musée. */
  lien: string;
  recupereeLe?: string;
}

const nettoyer = (s: unknown): string | undefined => (typeof s === 'string' ? texteBrut(s) : undefined);
const nombre = (n: unknown): number | undefined => (typeof n === 'number' && Number.isFinite(n) ? n : undefined);

// ——— Cleveland ———
export function urlRechercheCleveland(q: string, limite = 12): string {
  const p = new URLSearchParams({ q, has_image: '1', cc0: '1', limit: String(limite) });
  return `https://openaccess-api.clevelandart.org/api/artworks/?${p}`;
}

interface Cleveland {
  id: number;
  title: string;
  creation_date?: string;
  creation_date_earliest?: number;
  creation_date_latest?: number;
  culture?: string[];
  technique?: string;
  measurements?: string;
  accession_number: string;
  creditline?: string;
  description?: string;
  wall_description?: string;
  provenance?: Array<{ description?: string; date?: string }>;
  citations?: Array<{ citation?: string; page_number?: string }>;
  images?: { web?: { url?: string } };
  url: string;
}

export function lireCleveland(json: unknown): NoticeMusee[] {
  const data = (json as { data?: Cleveland[] }).data ?? [];
  return data.map((a) => ({
    source: 'cleveland',
    idMusee: String(a.id),
    titre: a.title,
    datation: a.creation_date ?? '',
    debut: nombre(a.creation_date_earliest),
    fin: nombre(a.creation_date_latest),
    culture: a.culture?.filter(Boolean).join(' ; ') || undefined,
    materiau: a.technique || undefined,
    dimensions: a.measurements || undefined,
    inventaire: a.accession_number,
    creditLine: a.creditline || undefined,
    description: nettoyer(a.wall_description) ?? nettoyer(a.description),
    provenance: a.provenance
      ?.map((p) => [nettoyer(p.description), p.date ? `(${p.date})` : ''].filter(Boolean).join(' '))
      .filter(Boolean),
    bibliographie: a.citations
      ?.map((c) => [nettoyer(c.citation), c.page_number ? `— ${c.page_number}` : ''].filter(Boolean).join(' '))
      .filter(Boolean),
    image: a.images?.web?.url,
    vignette: a.images?.web?.url,
    lien: a.url,
  }));
}

// ——— Met ———
export function urlRechercheMet(q: string, limite = 8): string {
  const p = new URLSearchParams({ q, hasImages: 'true', limit: String(limite) });
  return `https://collectionapi.metmuseum.org/public/collection/v1.1/search?${p}`;
}

export const urlObjetMet = (id: number | string) => `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;

export function lireIdsMet(json: unknown): number[] {
  return ((json as { objectIDs?: number[] | null }).objectIDs ?? []).filter((n) => typeof n === 'number');
}

interface Met {
  objectID: number;
  title: string;
  objectDate?: string;
  objectBeginDate?: number;
  objectEndDate?: number;
  culture?: string;
  period?: string;
  dynasty?: string;
  medium?: string;
  dimensions?: string;
  accessionNumber: string;
  creditLine?: string;
  isPublicDomain?: boolean;
  primaryImage?: string;
  primaryImageSmall?: string;
  objectURL: string;
}

/** Notice du Met, ou rien si l'objet n'est pas dans le domaine public (image non réutilisable). */
export function lireObjetMet(json: unknown): NoticeMusee | undefined {
  const o = json as Met;
  if (!o?.objectID || !o.isPublicDomain || !o.primaryImageSmall) return undefined;
  return {
    source: 'met',
    idMusee: String(o.objectID),
    titre: o.title,
    datation: o.objectDate ?? '',
    debut: nombre(o.objectBeginDate),
    fin: nombre(o.objectEndDate),
    culture: [o.culture, o.period, o.dynasty].filter(Boolean).join(' ; ') || undefined,
    materiau: o.medium || undefined,
    dimensions: o.dimensions || undefined,
    inventaire: o.accessionNumber,
    creditLine: o.creditLine || undefined,
    image: o.primaryImageSmall,
    vignette: o.primaryImageSmall,
    lien: o.objectURL,
  };
}

// ——— Art Institute of Chicago ———
const CHAMPS_AIC =
  'id,title,date_display,date_start,date_end,place_of_origin,medium_display,dimensions,main_reference_number,credit_line,description,image_id,is_public_domain,provenance_text,publication_history';

export function urlRechercheAic(q: string, limite = 12): string {
  const p = new URLSearchParams({ q, limit: String(limite), fields: CHAMPS_AIC, 'query[term][is_public_domain]': 'true' });
  return `https://api.artic.edu/api/v1/artworks/search?${p}`;
}

interface Aic {
  id: number;
  title: string;
  date_display?: string;
  date_start?: number;
  date_end?: number;
  place_of_origin?: string;
  medium_display?: string;
  dimensions?: string;
  main_reference_number: string;
  credit_line?: string;
  description?: string;
  image_id?: string | null;
  is_public_domain?: boolean;
  provenance_text?: string;
  publication_history?: string;
}

export function lireAic(json: unknown): NoticeMusee[] {
  const data = (json as { data?: Aic[] }).data ?? [];
  return data
    .filter((a) => a.is_public_domain && a.image_id)
    .map((a) => {
      const iiif = `https://www.artic.edu/iiif/2/${a.image_id}`;
      return {
        source: 'aic' as const,
        idMusee: String(a.id),
        titre: a.title,
        datation: a.date_display ?? '',
        debut: nombre(a.date_start),
        fin: nombre(a.date_end),
        culture: a.place_of_origin || undefined,
        materiau: a.medium_display || undefined,
        dimensions: a.dimensions || undefined,
        inventaire: a.main_reference_number,
        creditLine: a.credit_line || undefined,
        description: nettoyer(a.description),
        provenance: a.provenance_text ? [nettoyer(a.provenance_text)!] : undefined,
        bibliographie: a.publication_history
          ?.split(/\n+/)
          .map((l) => nettoyer(l))
          .filter((l): l is string => !!l),
        image: `${iiif}/full/843,/0/default.jpg`,
        vignette: `${iiif}/full/400,/0/default.jpg`,
        lien: `https://www.artic.edu/artworks/${a.id}`,
      };
    });
}

// ——— Recherche dans les trois musées ———
async function json(url: string, signal?: AbortSignal): Promise<unknown> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`${new URL(url).host} a répondu ${r.status}`);
  return r.json();
}

async function chercherMet(q: string, signal?: AbortSignal): Promise<NoticeMusee[]> {
  const ids = lireIdsMet(await json(urlRechercheMet(q), signal));
  const objets = await Promise.allSettled(ids.map((id) => json(urlObjetMet(id), signal)));
  return objets.flatMap((o) => (o.status === 'fulfilled' ? [lireObjetMet(o.value)].filter((n): n is NoticeMusee => !!n) : []));
}

const CHERCHEURS: Record<SourceMusee, (q: string, signal?: AbortSignal) => Promise<NoticeMusee[]>> = {
  cleveland: async (q, s) => lireCleveland(await json(urlRechercheCleveland(q), s)),
  met: chercherMet,
  aic: async (q, s) => lireAic(await json(urlRechercheAic(q), s)),
};

export interface ResultatsMusees {
  notices: NoticeMusee[];
  /** Musées qui n'ont pas répondu. */
  erreurs: SourceMusee[];
}

/** Interroge les musées en parallèle ; un musée en panne n'empêche pas d'afficher les autres. */
export async function chercherDansLesMusees(
  q: string,
  sources: SourceMusee[] = ['cleveland', 'met', 'aic'],
  signal?: AbortSignal,
): Promise<ResultatsMusees> {
  const reponses = await Promise.allSettled(sources.map((s) => CHERCHEURS[s](q, signal)));
  const notices: NoticeMusee[] = [];
  const erreurs: SourceMusee[] = [];
  reponses.forEach((r, i) => (r.status === 'fulfilled' ? notices.push(...r.value) : erreurs.push(sources[i])));
  // Alterne les musées pour ne pas afficher d'abord tout Cleveland.
  const parSource = sources.map((s) => notices.filter((n) => n.source === s));
  const melange: NoticeMusee[] = [];
  for (let i = 0; parSource.some((l) => i < l.length); i++) parSource.forEach((l) => l[i] && melange.push(l[i]));
  return { notices: melange, erreurs };
}

/** Datation lisible à partir d'une notice (« 1000s » chez Cleveland devient « XIe s. »). */
export function datationNotice(n: NoticeMusee): string {
  if (n.debut !== undefined && n.fin !== undefined && /^\d{3,4}s$/.test(n.datation) && n.fin - n.debut === 99) {
    return `${siecle(n.debut + 1)} s.`;
  }
  return n.datation;
}

function siecle(annee: number): string {
  const s = Math.ceil(Math.abs(annee) / 100);
  const romain = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'][s] ?? String(s);
  return `${romain}e${annee < 0 ? ' av. J.-C.' : ''}`;
}
