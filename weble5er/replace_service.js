const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const newServicePath = path.join(__dirname, 'src', 'app', 'home', 'requests', 'requests.service.new.ts');
const currentServicePath = path.join(__dirname, 'src', 'app', 'home', 'requests', 'requests.service.ts');

try {
  // Lire le contenu du nouveau fichier
  const newContent = fs.readFileSync(newServicePath, 'utf8');
  
  // Écrire le contenu dans le fichier actuel
  fs.writeFileSync(currentServicePath, newContent);
  
  console.log('Le fichier requests.service.ts a été remplacé avec succès par le contenu de requests.service.new.ts');
} catch (error) {
  console.error('Erreur lors du remplacement du fichier:', error);
}
