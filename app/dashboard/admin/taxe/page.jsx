// DIACARE/app/dashboard/admin/taxe/page.jsx

// Importez votre composant TaxeForm.tsx
// Le chemin '../../../../../components/taxe/TaxeForm.tsx' est correct
// étant donné votre structure de dossier typique Next.js avec `app` à la racine de `src`.
import TaxeForm from '@/components/taxe/TaxeForm.tsx';
// (Optionnel) Vous pouvez définir des métadonnées spécifiques à cette page.
// Cela sera utilisé pour le <title> de la page dans le navigateur,
// les balises <meta> pour le SEO, etc.
export const metadata = {
  title: 'DiaCare - Formulaire de Frais CHU Agadir',
  description: 'Formulaire de saisie des frais et calcul de taxe pour le Centre Hospitalier Universitaire Agadir.',
};

/**
 * Ce composant est la page qui sera rendue lorsque l'utilisateur accède à la route /dashboard/admin/taxe.
 * Dans l'App Router de Next.js, les composants de page sont des Server Components par défaut.
 * Ils peuvent importer et rendre directement des Client Components (comme TaxeForm.tsx) qui contiennent l'interactivité.
 */
export default function TaxePage() {
  return (
    // Le composant TaxeForm est un Client Component et contient toute la logique et l'UI du formulaire.
    // Les layouts parents (comme app/layout.tsx et app/dashboard/layout.tsx)
    // envelopperont automatiquement le contenu rendu par cette page.
    <TaxeForm />
  );
}