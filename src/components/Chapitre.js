import React from 'react';
import chapitre1 from '../data/chapitre1.json'; // Ajustez le chemin selon votre structure de dossier

const Chapitre = () => {
  return (
    <div>
      <h1>{chapitre1.chapitre}</h1>
      <p>{chapitre1.contenu.introduction}</p>
      {chapitre1.contenu.sous_sections.map((sousSection, index) => (
        <div key={index}>
          <h2>{sousSection.numero}</h2>
          <p>{sousSection.contenu}</p>
        </div>
      ))}
    </div>
  );
};

export default Chapitre;