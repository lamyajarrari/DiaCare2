const fs = require('fs');
const path = require('path');

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fichier traduit: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'écriture de ${filePath}:`, error.message);
  }
}

// Fonction pour ajouter l'import de traduction
function addTranslationImport(content) {
  if (!content.includes('useTranslation')) {
    // Ajouter l'import après les autres imports
    const importMatch = content.match(/import.*from.*['"]@\/lib\/api['"]/);
    if (importMatch) {
      const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, importIndex) + '\nimport { useTranslation } from "@/lib/translations"' + content.slice(importIndex);
    } else {
      // Ajouter après le dernier import
      const lastImportMatch = content.match(/import.*from.*['"][^'"]*['"];?\s*$/m);
      if (lastImportMatch) {
        const lastImportIndex = content.lastIndexOf(lastImportMatch[0]) + lastImportMatch[0].length;
        content = content.slice(0, lastImportIndex) + '\nimport { useTranslation } from "@/lib/translations"' + content.slice(lastImportIndex);
      }
    }
  }
  return content;
}

// Fonction pour ajouter le hook useTranslation
function addTranslationHook(content) {
  if (!content.includes('const { t } = useTranslation()')) {
    // Trouver la ligne après les déclarations de state
    const stateMatch = content.match(/const \[.*\] = useState\(/g);
    if (stateMatch) {
      const lastStateMatch = stateMatch[stateMatch.length - 1];
      const lastStateIndex = content.lastIndexOf(lastStateMatch);
      const nextLineIndex = content.indexOf('\n', lastStateIndex) + 1;
      content = content.slice(0, nextLineIndex) + '  const { t } = useTranslation()\n' + content.slice(nextLineIndex);
    }
  }
  return content;
}

// Fonction pour traduire les textes courants
function translateCommonTexts(content) {
  const translations = {
    // Navigation
    'Dashboard': 't(\'navigation.dashboard\')',
    'Users': 't(\'navigation.users\')',
    'Machines': 't(\'navigation.machines\')',
    'Reports': 't(\'navigation.reports\')',
    'Alerts': 't(\'navigation.alerts\')',
    'Interventions': 't(\'navigation.interventions\')',
    'Maintenance': 't(\'navigation.maintenance\')',
    'Fault History': 't(\'navigation.faultHistory\')',
    'Logout': 't(\'navigation.logout\')',
    'Welcome,': 't(\'navigation.welcome\') + \',\'',
    
    // Actions
    'Save': 't(\'common.save\')',
    'Cancel': 't(\'common.cancel\')',
    'Delete': 't(\'common.delete\')',
    'Edit': 't(\'common.edit\')',
    'Add': 't(\'common.add\')',
    'Search': 't(\'common.search\')',
    'Loading...': 't(\'common.loading\')',
    'Error': 't(\'common.error\')',
    'Success': 't(\'common.success\')',
    'No data': 't(\'common.noData\')',
    'No results': 't(\'common.noResults\')',
    
    // Status
    'Pending': 't(\'common.pending\')',
    'Completed': 't(\'common.completed\')',
    'In Progress': 't(\'common.inProgress\')',
    'Resolved': 't(\'alerts.resolved\')',
    
    // Form labels
    'Name': 't(\'common.name\')',
    'Email': 't(\'login.email\')',
    'Password': 't(\'login.password\')',
    'Status': 't(\'common.status\')',
    'Date': 't(\'common.date\')',
    'Type': 't(\'common.type\')',
    'Description': 't(\'common.description\')',
    'Notes': 't(\'common.notes\')',
    'Actions': 't(\'common.actions\')',
  };

  let translatedContent = content;
  
  for (const [english, translation] of Object.entries(translations)) {
    // Remplacer les chaînes entre guillemets
    const regex = new RegExp(`"${english}"`, 'g');
    translatedContent = translatedContent.replace(regex, `{${translation}}`);
    
    // Remplacer les chaînes entre apostrophes
    const regex2 = new RegExp(`'${english}'`, 'g');
    translatedContent = translatedContent.replace(regex2, `{${translation}}`);
  }

  return translatedContent;
}

// Fonction pour traduire un fichier
function translateFile(filePath) {
  console.log(`🔄 Traduction de: ${filePath}`);
  
  let content = readFile(filePath);
  if (!content) return;

  // Ajouter l'import de traduction
  content = addTranslationImport(content);
  
  // Ajouter le hook useTranslation
  content = addTranslationHook(content);
  
  // Traduire les textes courants
  content = translateCommonTexts(content);
  
  // Écrire le fichier traduit
  writeFile(filePath, content);
}

// Fonction pour parcourir récursivement les dossiers
function translateDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignorer les dossiers node_modules, .git, etc.
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
        translateDirectory(fullPath);
      }
    } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
      // Traduire seulement les fichiers React
      translateFile(fullPath);
    }
  }
}

// Point d'entrée
console.log('🚀 Début de la traduction automatique...');

// Dossiers à traduire
const directories = [
  'app',
  'components'
];

for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`\n📁 Traduction du dossier: ${dir}`);
    translateDirectory(dir);
  }
}

console.log('\n✅ Traduction terminée !');
console.log('\n📝 Notes importantes:');
console.log('1. Vérifiez que tous les imports de traduction ont été ajoutés');
console.log('2. Vérifiez que le hook useTranslation a été ajouté dans chaque composant');
console.log('3. Testez l\'application pour vous assurer que tout fonctionne');
console.log('4. Ajoutez manuellement les traductions manquantes dans lib/translations.js'); 