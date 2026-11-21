/** Texte libre ; les lignes commençant par « • » deviennent une liste, avec l'éventuel intitulé (« Contexte : ») en gras. */
export function Bloc({ titre, texte }: { titre: string; texte: string }) {
  const lignes = texte.split('\n').filter((l) => l.trim());
  const enListe = lignes.length > 1 && lignes.every((l) => l.trimStart().startsWith('•'));
  return (
    <section className="bloc">
      <h3>{titre}</h3>
      {enListe ? (
        <ul className="points">
          {lignes.map((l, i) => {
            const contenu = l.replace(/^\s*•\s*/, '');
            const m = /^([^:]{2,40}) : (.*)$/s.exec(contenu);
            return <li key={i}>{m ? <><strong>{m[1]} :</strong> {m[2]}</> : contenu}</li>;
          })}
        </ul>
      ) : (
        <p>{texte}</p>
      )}
    </section>
  );
}
