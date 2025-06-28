# Guide de Déploiement - DiaCare

## Déploiement sur Vercel (Recommandé)

### 1. Prérequis

- Compte GitHub avec le code source
- Compte Vercel (gratuit)
- Base de données PostgreSQL (Neon, Supabase, ou autre)

### 2. Préparer la Base de Données

#### Option A: Neon (Recommandé)

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet
3. Copier l'URL de connexion PostgreSQL

#### Option B: Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans Settings > Database pour copier l'URL

### 3. Déployer sur Vercel

#### Étape 1: Connecter GitHub

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer "New Project"
4. Importer le repository DiaCare

#### Étape 2: Configurer les Variables d'Environnement

Dans Vercel, aller dans Settings > Environment Variables et ajouter :

```
DATABASE_URL=postgresql://username:password@host:port/database
```

#### Étape 3: Déployer

1. Cliquer "Deploy"
2. Attendre la fin du build
3. Vercel va automatiquement :
   - Installer les dépendances
   - Générer le client Prisma
   - Construire l'application

### 4. Initialiser la Base de Données

Après le déploiement, tu dois initialiser la base de données :

#### Option A: Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Pousser le schéma
vercel env pull .env
npx prisma db push

# Ajouter les données de test
npx prisma db seed
```

#### Option B: Via Interface Web

1. Aller sur ton dashboard Vercel
2. Ouvrir les logs de build
3. Vérifier que Prisma s'est bien généré

### 5. Variables d'Environnement Optionnelles

Si tu veux les notifications email, ajouter dans Vercel :

```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
CRON_SECRET_KEY=your-secret-key-for-cron-jobs
```

### 6. Domaine Personnalisé (Optionnel)

1. Dans Vercel, aller dans Settings > Domains
2. Ajouter ton domaine personnalisé
3. Suivre les instructions pour configurer les DNS

## Déploiement sur Autres Plateformes

### Netlify

- Similaire à Vercel
- Utiliser `netlify.toml` pour la configuration

### Railway

- Bonne intégration avec PostgreSQL
- Déploiement automatique depuis GitHub

### DigitalOcean App Platform

- Plus de contrôle
- Configuration manuelle requise

## Dépannage

### Erreur Prisma

- Vérifier que `DATABASE_URL` est correct
- S'assurer que la base de données est accessible
- Vérifier les logs de build Vercel

### Erreur de Build

- Vérifier que toutes les dépendances sont dans `package.json`
- S'assurer que le script `build` fonctionne localement

### Base de Données Vide

- Exécuter `npx prisma db seed` après le déploiement
- Vérifier que les migrations sont appliquées

## Support

Pour toute question sur le déploiement, consulter :

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Next.js](https://nextjs.org/docs)
