/**
 * Appels à l'API Claude (Anthropic) pour le mode examen : correction de copies, commentaire de plans,
 * génération de sujets. La clé d'API est fournie par l'utilisatrice et stockée uniquement sur l'appareil
 * (comme dans JeSuisCoach). Le SDK n'est chargé qu'au premier appel.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { type TypeEpreuve, TYPES_EPREUVE } from '../data/sujets';
import {
  type CommentairePlan,
  type Copie,
  type Correction,
  GRILLES,
  lireCommentairePlan,
  lireCorrection,
  lireSujetsGeneres,
  NOTE_CRITERE_MAX,
  SCHEMA_CORRECTION,
  SCHEMA_PLAN,
  SCHEMA_SUJETS,
} from '../domain/examen';

export const MODELE_IA = 'claude-opus-5-5';
const CLE = 'madameladocteure:ia';

export interface ReglagesIA {
  cle: string;
  /** Consentement explicite à l'envoi des copies et sujets à Anthropic. */
  consentement: boolean;
}

export function lireReglagesIA(): ReglagesIA {
  try {
    return { cle: '', consentement: false, ...JSON.parse(localStorage.getItem(CLE) ?? '{}') };
  } catch {
    return { cle: '', consentement: false };
  }
}

export function enregistrerReglagesIA(r: ReglagesIA) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...r, cle: r.cle.trim() }));
  } catch {
    /* stockage indisponible */
  }
}

export const iaPrete = (r = lireReglagesIA()) => r.consentement && r.cle.length > 10;

async function client(): Promise<Anthropic> {
  const { default: AnthropicClient } = await import('@anthropic-ai/sdk');
  return new AnthropicClient({
    apiKey: lireReglagesIA().cle,
    // Appel direct depuis le navigateur avec la clé personnelle, stockée sur l'appareil.
    dangerouslyAllowBrowser: true,
    maxRetries: 2,
  });
}

/** Message d'erreur compréhensible. */
export async function expliquerErreur(e: unknown): Promise<string> {
  const { default: A } = await import('@anthropic-ai/sdk');
  if (e instanceof A.AuthenticationError) return 'Clé d’API refusée : vérifie-la dans Menu › Réglages › Intelligence artificielle.';
  if (e instanceof A.PermissionDeniedError) return 'Cette clé n’a pas accès au modèle demandé.';
  if (e instanceof A.RateLimitError) return 'Trop de demandes pour le moment : réessaie dans une minute.';
  if (e instanceof A.APIConnectionError) return 'Pas de connexion au service d’IA : vérifie le réseau.';
  if (e instanceof A.APIError) return `Erreur du service d’IA (${e.status ?? '?'}). Réessaie plus tard.`;
  return e instanceof Error ? e.message : 'Erreur inattendue.';
}

type Contenu = Anthropic.Beta.BetaContentBlockParam[];

/** Envoie la requête et renvoie le JSON produit (sortie structurée conforme au schéma). */
async function structure(params: { system: string; contenu: Contenu; schema: object; effort: 'medium' | 'high' }): Promise<unknown> {
  if (!iaPrete()) throw new Error('IA non configurée : ajoute ta clé d’API et ton accord dans Menu › Réglages › Intelligence artificielle.');
  const c = await client();
  const message = await c.beta.messages.create({
    model: MODELE_IA,
    max_tokens: 16000,
    // En cas de refus par un filtre de sécurité, la requête est rejouée sur le modèle recommandé.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: params.effort, format: { type: 'json_schema', schema: params.schema as Record<string, unknown> } },
    system: params.system,
    messages: [{ role: 'user', content: params.contenu }],
  });
  if (message.stop_reason === 'refusal') throw new Error('L’IA n’a pas pu traiter cette demande.');
  if (message.stop_reason === 'max_tokens') throw new Error('Réponse trop longue, interrompue : réessaie.');
  const texte = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
  if (!texte) throw new Error('Réponse vide de l’IA.');
  try {
    return JSON.parse(texte);
  } catch {
    throw new Error('Réponse de l’IA illisible.');
  }
}

const SYSTEME_JURY =
  'Tu es membre du jury du concours de conservateur du patrimoine (État, spécialité archéologie, option « archéologie, histoire de l’art et des ' +
  'civilisations de l’Inde et du monde indianisé »). Tu corriges en français, avec l’exigence d’un jury : précis, juste, bienveillant mais sans ' +
  'complaisance. Tu t’appuies uniquement sur ce que contient la copie ; tu signales les erreurs factuelles (dates, attributions, lieux) quand tu en ' +
  'es sûr, et tu dis quand tu as un doute plutôt que d’inventer. Ta note est indicative : elle aide la candidate à progresser et ne remplace pas ' +
  'la correction par un enseignant ou un pair.';

async function enBase64(blob: Blob): Promise<{ data: string; type: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  const url = await new Promise<string>((ok, ko) => {
    const lecteur = new FileReader();
    lecteur.onload = () => ok(String(lecteur.result));
    lecteur.onerror = () => ko(lecteur.error);
    lecteur.readAsDataURL(blob);
  });
  const type = blob.type === 'image/png' || blob.type === 'image/webp' ? blob.type : 'image/jpeg';
  return { data: url.split(',')[1], type };
}

/** Corrige une copie (texte tapé, ou photos d'une copie manuscrite) selon la grille de l'épreuve. */
export async function corrigerCopie(copie: Copie, photos: Blob[]): Promise<Correction> {
  const type = copie.type === 'plan' ? 'specialite' : copie.type;
  const epreuve = TYPES_EPREUVE.find((t) => t.id === type)!;
  const grille = GRILLES[type].map((c, i) => `${i + 1}. ${c}`).join('\n');
  const contenu: Contenu = [];
  for (const p of photos) {
    const { data, type: media } = await enBase64(p);
    contenu.push({ type: 'image', source: { type: 'base64', media_type: media, data } });
  }
  contenu.push({
    type: 'text',
    text:
      `Épreuve : ${epreuve.nom}.\nSujet : « ${copie.sujet} »\n` +
      `Durée prévue : ${copie.dureePrevueMin} minutes.\n\n` +
      `Grille (chaque critère noté sur ${NOTE_CRITERE_MAX}, demi-points possibles) :\n${grille}\n\n` +
      (photos.length
        ? `La copie est manuscrite : ${photos.length} photo(s) ci-dessus, dans l’ordre des pages. Si un passage est illisible, dis-le dans le commentaire du critère concerné.\n`
        : `Copie :\n"""\n${copie.texte}\n"""\n`) +
      '\nÉvalue chaque critère de la grille, dans cet ordre, avec un commentaire précis citant la copie. Donne une note indicative sur 20 ' +
      '(qui n’est pas forcément la somme des critères), une appréciation générale de 3 à 5 phrases, les points forts, ce qu’il faut améliorer, ' +
      'et 3 à 5 conseils concrets pour la prochaine copie (lectures, œuvres à mobiliser, méthode).',
  });
  return lireCorrection(await structure({ system: SYSTEME_JURY, contenu, schema: SCHEMA_CORRECTION, effort: 'high' }));
}

/** Commente une problématique et un plan rédigés en 15 minutes, et propose un plan de comparaison. */
export async function commenterPlan(copie: Copie): Promise<CommentairePlan> {
  const contenu: Contenu = [
    {
      type: 'text',
      text:
        `Exercice « plan en 15 minutes ». Sujet : « ${copie.sujet} »\n\n` +
        `Problématique proposée :\n"""\n${copie.problematique ?? ''}\n"""\n\nPlan proposé :\n"""\n${copie.plan ?? ''}\n"""\n\n` +
        'Commente la problématique (pertinence, définition des termes, enjeux) puis le plan (logique, progression, équilibre, risques de hors-sujet), ' +
        'en citant ce qui a été écrit. Donne une appréciation générale courte, les points forts, ce qu’il faut améliorer, puis un plan de comparaison ' +
        '(problématique, 2 ou 3 parties avec 2 ou 3 sous-parties chacune, en mentionnant des œuvres précises quand c’est pertinent). ' +
        'Ce plan est une proposition parmi d’autres, pas un corrigé unique.',
    },
  ];
  return lireCommentairePlan(await structure({ system: SYSTEME_JURY, contenu, schema: SCHEMA_PLAN, effort: 'medium' }));
}

/** Génère des sujets d'entraînement dans l'esprit du concours. */
export async function genererSujets(type: TypeEpreuve, theme: string, nombre = 5): Promise<string[]> {
  const epreuve = TYPES_EPREUVE.find((t) => t.id === type)!;
  const contenu: Contenu = [
    {
      type: 'text',
      text:
        `Propose ${nombre} sujets d’entraînement pour l’épreuve « ${epreuve.nom} » (${epreuve.description}), ` +
        'dans l’esprit des sujets du concours : formulations courtes, problématisables, ni trop larges ni trop pointues, en français. ' +
        (type === 'specialite' ? 'Couvre des périodes et des aires variées de l’Inde et du monde indianisé (Asie du Sud-Est comprise). ' : '') +
        (type === 'synthese' ? 'Pour la note de synthèse, donne des thèmes de dossier (patrimoine, musées, politiques culturelles). ' : '') +
        (theme.trim() ? `Thème souhaité : ${theme.trim()}. ` : '') +
        'Ne prétends pas que ce sont des sujets déjà tombés.',
    },
  ];
  return lireSujetsGeneres(await structure({ system: SYSTEME_JURY, contenu, schema: SCHEMA_SUJETS, effort: 'medium' }));
}

export const typeEpreuve = (t: TypeEpreuve) => TYPES_EPREUVE.find((x) => x.id === t)!;
