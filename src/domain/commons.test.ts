import { describe, expect, it } from 'vitest';
import { lireReponse, texteBrut, urlRecherche, urlRedimensionnee } from './commons';

const reponse = {
  continue: { gsroffset: 24, continue: 'gsroffset||' },
  query: {
    pages: [
      {
        title: 'File:Bayon faces.jpg',
        index: 2,
        imageinfo: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Bayon_faces.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Bayon_faces.jpg',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Bayon_faces.jpg/330px-Bayon_faces.jpg',
            width: 4000,
            height: 3000,
            mime: 'image/jpeg',
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:X">Jean&nbsp;Dupont</a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          },
        ],
      },
      {
        title: 'File:Buddha Gandhara.png',
        index: 1,
        imageinfo: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Buddha_Gandhara.png',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Buddha_Gandhara.png',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Buddha_Gandhara.png/330px-Buddha_Gandhara.png',
            width: 800,
            height: 1200,
            mime: 'image/png',
            extmetadata: { ObjectName: { value: 'Bouddha debout' } },
          },
        ],
      },
      { title: 'File:Sans info.jpg', index: 3 },
    ],
  },
};

describe('Wikimedia Commons', () => {
  it('construit une recherche limitée aux images', () => {
    const url = new URL(urlRecherche('Bayon', 24));
    expect(url.searchParams.get('gsrsearch')).toBe('Bayon filetype:bitmap');
    expect(url.searchParams.get('gsroffset')).toBe('24');
    expect(url.searchParams.get('origin')).toBe('*');
  });

  it('lit les résultats dans l’ordre de pertinence, avec les crédits', () => {
    const { resultats, suite } = lireReponse(reponse);
    expect(suite).toBe(24);
    expect(resultats.map((r) => r.titre)).toEqual(['Bouddha debout', 'Bayon faces']);
    const bayon = resultats[1];
    expect(bayon.auteur).toBe('Jean Dupont');
    expect(bayon.licence).toBe('CC BY-SA 4.0');
    expect(bayon.urlImport).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Bayon_faces.jpg/1280px-Bayon_faces.jpg',
    );
    // Original plus petit que la taille d'import : on prend l'original.
    expect(resultats[0].urlImport).toBe('https://upload.wikimedia.org/wikipedia/commons/c/cd/Buddha_Gandhara.png');
  });

  it('gère une réponse vide', () => {
    expect(lireReponse({})).toEqual({ resultats: [], suite: undefined });
  });

  it('nettoie le HTML des métadonnées', () => {
    expect(texteBrut('<b>Musée&amp;Guimet</b>  ')).toBe('Musée&Guimet');
    expect(texteBrut('<br/>')).toBeUndefined();
  });

  it('retombe sur l’original si la vignette a un format inattendu', () => {
    expect(urlRedimensionnee('https://x/y.jpg', 'https://x/orig.jpg', 5000, 1280)).toBe('https://x/orig.jpg');
  });
});
