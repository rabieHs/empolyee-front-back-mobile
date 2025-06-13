const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const fixedServicePath = path.join(__dirname, 'src', 'app', 'home', 'requests', 'requests.service.fixed.ts');
const currentServicePath = path.join(__dirname, 'src', 'app', 'home', 'requests', 'requests.service.ts');

try {
  // Lire le contenu du fichier fixé
  const fixedContent = fs.readFileSync(fixedServicePath, 'utf8');
  
  // Écrire le contenu dans le fichier actuel
  fs.writeFileSync(currentServicePath, fixedContent);
  
  console.log('Le fichier requests.service.ts a été remplacé avec succès par le contenu de requests.service.fixed.ts');
} catch (error) {
  console.error('Erreur lors du remplacement du fichier:', error);
}
