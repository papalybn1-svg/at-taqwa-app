const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './assets/image chapitre';
const outputDir = './assets/image chapitre/optimized';

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImages() {
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.png'));
  
  console.log('🔄 Optimisation des images en cours...');
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    
    try {
      // Obtenir les stats du fichier original
      const stats = fs.statSync(inputPath);
      const originalSize = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`📸 Optimisation de ${file} (${originalSize}MB)...`);
      
      // Optimiser l'image
      await sharp(inputPath)
        .resize(600, 600, { 
          fit: 'cover',
          position: 'center'
        })
        .png({ 
          quality: 85,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      // Obtenir les stats du fichier optimisé
      const optimizedStats = fs.statSync(outputPath);
      const optimizedSize = (optimizedStats.size / 1024 / 1024).toFixed(2);
      const reduction = ((stats.size - optimizedStats.size) / stats.size * 100).toFixed(1);
      
      console.log(`✅ ${file}: ${originalSize}MB → ${optimizedSize}MB (${reduction}% de réduction)`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'optimisation de ${file}:`, error);
    }
  }
  
  console.log('🎉 Optimisation terminée !');
  console.log(`📁 Images optimisées dans: ${outputDir}`);
}

optimizeImages().catch(console.error); 