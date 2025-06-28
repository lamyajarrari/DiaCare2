# Guide de Traduction - DiaCare

## 🌍 Vue d'ensemble

Ce guide explique comment traduire l'application DiaCare en français et comment étendre le système de traduction pour d'autres langues.

## 📁 Structure des Traductions

### Fichier Principal

- `lib/translations.js` - Contient toutes les traductions françaises

### Organisation des Traductions

```javascript
export const translations = {
  // Navigation
  navigation: {
    dashboard: "Tableau de Bord",
    users: "Utilisateurs",
    // ...
  },

  // Pages spécifiques
  login: { ... },
  dashboard: { ... },
  machines: { ... },
  // ...
}
```

## 🔧 Utilisation dans les Composants

### 1. Import du Hook

```javascript
import { useTranslation } from "@/lib/translations";
```

### 2. Utilisation dans le Composant

```javascript
export default function MonComposant() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("navigation.dashboard")}</h1>
      <p>{t("common.loading")}</p>
    </div>
  );
}
```

### 3. Traduction avec Paramètres

```javascript
// Dans translations.js
{
  welcome: "Bienvenue, {name}";
}

// Dans le composant
{
  t("welcome", { name: userName });
}
```

## 📝 Traductions Disponibles

### Navigation

- `navigation.dashboard` - Tableau de Bord
- `navigation.users` - Utilisateurs
- `navigation.machines` - Machines
- `navigation.reports` - Rapports
- `navigation.alerts` - Alertes
- `navigation.interventions` - Interventions
- `navigation.maintenance` - Maintenance
- `navigation.faultHistory` - Historique des Pannes
- `navigation.logout` - Déconnexion
- `navigation.welcome` - Bienvenue

### Connexion

- `login.title` - Connexion
- `login.email` - Email
- `login.password` - Mot de passe
- `login.signIn` - Se connecter
- `login.signingIn` - Connexion en cours...
- `login.enterEmail` - Entrez votre email
- `login.enterPassword` - Entrez votre mot de passe
- `login.loginFailed` - Échec de la connexion
- `login.errorOccurred` - Une erreur s'est produite lors de la connexion

### Tableau de Bord

- `dashboard.activeAlerts` - Alertes Actives
- `dashboard.requireAttention` - Nécessitent une attention
- `dashboard.pendingMaintenance` - Maintenance en Attente
- `dashboard.scheduledTasks` - Tâches programmées
- `dashboard.interventions` - Interventions
- `dashboard.totalInterventions` - Interventions totales
- `dashboard.machines` - Machines
- `dashboard.totalMachines` - Machines totales
- `dashboard.users` - Utilisateurs
- `dashboard.totalUsers` - Utilisateurs totaux

### Machines

- `machines.title` - Gestion des Machines
- `machines.addMachine` - Ajouter une Machine
- `machines.editMachine` - Modifier la Machine
- `machines.deleteMachine` - Supprimer la Machine
- `machines.machineName` - Nom de la Machine
- `machines.inventoryNumber` - Numéro d'Inventaire
- `machines.department` - Département
- `machines.status` - Statut
- `machines.lastMaintenance` - Dernière Maintenance
- `machines.nextMaintenance` - Prochaine Maintenance

### Utilisateurs

- `users.title` - Gestion des Utilisateurs
- `users.addUser` - Ajouter un Utilisateur
- `users.editUser` - Modifier l'Utilisateur
- `users.deleteUser` - Supprimer l'Utilisateur
- `users.name` - Nom
- `users.email` - Email
- `users.role` - Rôle
- `users.patient` - Patient
- `users.technician` - Technicien
- `users.admin` - Administrateur

### Alertes

- `alerts.title` - Alertes
- `alerts.newAlert` - Nouvelle Alerte
- `alerts.editAlert` - Modifier l'Alerte
- `alerts.deleteAlert` - Supprimer l'Alerte
- `alerts.message` - Message
- `alerts.type` - Type
- `alerts.priority` - Priorité
- `alerts.status` - Statut
- `alerts.timestamp` - Horodatage
- `alerts.machine` - Machine
- `alerts.low` - Faible
- `alerts.medium` - Moyenne
- `alerts.high` - Élevée
- `alerts.critical` - Critique
- `alerts.pending` - En attente
- `alerts.resolved` - Résolue

### Interventions

- `interventions.title` - Interventions
- `interventions.newIntervention` - Nouvelle Intervention
- `interventions.editIntervention` - Modifier l'Intervention
- `interventions.deleteIntervention` - Supprimer l'Intervention
- `interventions.requestDate` - Date de Demande
- `interventions.requestedIntervention` - Intervention Demandée
- `interventions.arrivalAtWorkshop` - Arrivée à l'Atelier
- `interventions.department` - Département
- `interventions.requestedBy` - Demandé Par
- `interventions.returnToService` - Retour en Service
- `interventions.equipmentDescription` - Description de l'Équipement
- `interventions.inventoryNumber` - Numéro d'Inventaire
- `interventions.problemDescription` - Description du Problème
- `interventions.interventionType` - Type d'Intervention
- `interventions.datePerformed` - Date d'Exécution
- `interventions.tasksCompleted` - Tâches Accomplies
- `interventions.partsReplaced` - Pièces Remplacées
- `interventions.partDescription` - Description des Pièces
- `interventions.price` - Prix
- `interventions.technician` - Technicien
- `interventions.timeSpent` - Temps Passé
- `interventions.status` - Statut
- `interventions.notifications` - Notifications
- `interventions.preventive` - Préventive
- `interventions.curative` - Curative
- `interventions.emergency` - Urgence
- `interventions.inProgress` - En cours
- `interventions.markComplete` - Marquer comme Terminé
- `interventions.marking` - Marquage...
- `interventions.startMaintenance` - Démarrer la Maintenance

### Maintenance

- `maintenance.title` - Plan de Maintenance
- `maintenance.description` - Plan de maintenance préventive pour les machines de dialyse Fresenius 4008/6008
- `maintenance.threeMonthTasks` - Tâches 3 Mois
- `maintenance.sixMonthTasks` - Tâches 6 Mois
- `maintenance.yearlyTasks` - Tâches Annuelles
- `maintenance.quarterlyMaintenance` - Maintenance trimestrielle
- `maintenance.semiAnnualMaintenance` - Maintenance semestrielle
- `maintenance.annualMaintenance` - Maintenance annuelle
- `maintenance.maintenanceGuidelines` - Directives de Maintenance
- `maintenance.every3Months` - Tous les 3 Mois
- `maintenance.every6Months` - Tous les 6 Mois
- `maintenance.onceAYear` - Une fois par An
- `maintenance.replaceFilters` - • Remplacer les filtres / Nettoyer si nécessaire
- `maintenance.checkMotorizedClamps` - • Vérifier les pinces motorisées
- `maintenance.tightenConnections` - • Serrer les connexions électriques
- `maintenance.fullCalibration` - • Calibration complète avec outils calibrés
- `maintenance.inspectHydraulic` - • Inspecter les composants hydrauliques
- `maintenance.firmwareUpdates` - • Mises à jour du firmware via le service Fresenius
- `maintenance.replaceSeals` - • Remplacer les joints hydrauliques et roues de pompe
- `maintenance.electricalTests` - • Tests de sécurité électrique
- `maintenance.maintenanceReport` - • Mise à jour et archivage du rapport de maintenance
- `maintenance.noMaintenanceTasks` - Aucune tâche de maintenance programmée

### Contrôles de Maintenance

- `maintenanceControls.title` - Contrôles de Maintenance
- `maintenanceControls.addControl` - Ajouter un Contrôle
- `maintenanceControls.editControl` - Modifier le Contrôle
- `maintenanceControls.deleteControl` - Supprimer le Contrôle
- `maintenanceControls.machine` - Machine
- `maintenanceControls.technician` - Technicien
- `maintenanceControls.controlType` - Type de Contrôle
- `maintenanceControls.controlDate` - Date de Contrôle
- `maintenanceControls.nextControlDate` - Prochain Contrôle
- `maintenanceControls.notes` - Notes
- `maintenanceControls.status` - Statut
- `maintenanceControls.threeMonths` - 3 mois
- `maintenanceControls.sixMonths` - 6 mois
- `maintenanceControls.oneYear` - 1 an
- `maintenanceControls.overdue` - En retard
- `maintenanceControls.upcoming` - À venir
- `maintenanceControls.planned` - Planifié
- `maintenanceControls.noControlsFound` - Aucun contrôle de maintenance trouvé
- `maintenanceControls.noControlsMatch` - Aucun contrôle ne correspond à vos filtres

### Pannes

- `faults.title` - Historique des Pannes
- `faults.description` - Registre complet des incidents de machines et de leurs résolutions
- `faults.faultRecords` - Registres de Pannes
- `faults.searchFaults` - Rechercher des pannes...
- `faults.exportCSV` - Exporter CSV
- `faults.date` - Date
- `faults.faultType` - Type de Panne
- `faults.description` - Description
- `faults.downtime` - Temps d'Arrêt
- `faults.rootCause` - Cause Racine
- `faults.correctiveAction` - Action Corrective
- `faults.status` - Statut
- `faults.machine` - Machine
- `faults.patient` - Patient

### Taxe

- `taxe.title` - Gestion des Taxes
- `taxe.backToDashboard` - Retour au Tableau de Bord
- `taxe.downloadPDF` - Télécharger PDF
- `taxe.generating` - Génération...
- `taxe.errorGeneratingPDF` - Erreur lors de la génération du PDF. Veuillez réessayer.

### Commun

- `common.loading` - Chargement...
- `common.error` - Erreur
- `common.success` - Succès
- `common.save` - Enregistrer
- `common.cancel` - Annuler
- `common.delete` - Supprimer
- `common.edit` - Modifier
- `common.add` - Ajouter
- `common.search` - Rechercher
- `common.filter` - Filtrer
- `common.export` - Exporter
- `common.import` - Importer
- `common.download` - Télécharger
- `common.upload` - Télécharger
- `common.yes` - Oui
- `common.no` - Non
- `common.confirm` - Confirmer
- `common.back` - Retour
- `common.next` - Suivant
- `common.previous` - Précédent
- `common.close` - Fermer
- `common.open` - Ouvrir
- `common.view` - Voir
- `common.details` - Détails
- `common.actions` - Actions
- `common.status` - Statut
- `common.date` - Date
- `common.time` - Heure
- `common.name` - Nom
- `common.description` - Description
- `common.type` - Type
- `common.priority` - Priorité
- `common.notes` - Notes
- `common.comments` - Commentaires
- `common.created` - Créé
- `common.updated` - Mis à jour
- `common.createdBy` - Créé par
- `common.updatedBy` - Mis à jour par
- `common.noData` - Aucune donnée
- `common.noResults` - Aucun résultat
- `common.selectAll` - Tout sélectionner
- `common.deselectAll` - Tout désélectionner
- `common.select` - Sélectionner
- `common.choose` - Choisir
- `common.enter` - Entrer
- `common.input` - Saisir
- `common.required` - Requis
- `common.optional` - Optionnel
- `common.invalid` - Invalide
- `common.valid` - Valide
- `common.active` - Actif
- `common.inactive` - Inactif
- `common.enabled` - Activé
- `common.disabled` - Désactivé
- `common.visible` - Visible
- `common.hidden` - Masqué
- `common.public` - Public
- `common.private` - Privé
- `common.draft` - Brouillon
- `common.published` - Publié
- `common.archived` - Archivé
- `common.pending` - En attente
- `common.approved` - Approuvé
- `common.rejected` - Rejeté
- `common.completed` - Terminé
- `common.inProgress` - En cours
- `common.cancelled` - Annulé
- `common.failed` - Échoué
- `common.warning` - Avertissement
- `common.info` - Information
- `common.critical` - Critique
- `common.high` - Élevé
- `common.medium` - Moyen
- `common.low` - Faible
- `common.urgent` - Urgent
- `common.normal` - Normal
- `common.minor` - Mineur
- `common.major` - Majeur
- `common.today` - Aujourd'hui
- `common.yesterday` - Hier
- `common.tomorrow` - Demain
- `common.thisWeek` - Cette semaine
- `common.lastWeek` - La semaine dernière
- `common.nextWeek` - La semaine prochaine
- `common.thisMonth` - Ce mois
- `common.lastMonth` - Le mois dernier
- `common.nextMonth` - Le mois prochain
- `common.thisYear` - Cette année
- `common.lastYear` - L'année dernière
- `common.nextYear` - L'année prochaine

## 🚀 Script de Traduction Automatique

### Exécution

```bash
node scripts/translate-app.js
```

### Fonctionnalités

- Ajoute automatiquement les imports de traduction
- Ajoute le hook useTranslation
- Traduit les textes courants
- Parcourt récursivement les dossiers app/ et components/

### Limitations

- Ne traduit que les textes courants
- Nécessite une vérification manuelle
- Certains textes complexes peuvent nécessiter une traduction manuelle

## 🔄 Ajout de Nouvelles Traductions

### 1. Ajouter dans lib/translations.js

```javascript
export const translations = {
  // ... traductions existantes

  // Nouvelle section
  nouvelleSection: {
    nouveauTexte: "Nouveau texte en français",
    texteAvecParametre: "Texte avec {parametre}",
  },
};
```

### 2. Utiliser dans le composant

```javascript
const { t } = useTranslation();

// Texte simple
{
  t("nouvelleSection.nouveauTexte");
}

// Texte avec paramètre
{
  t("nouvelleSection.texteAvecParametre", { parametre: "valeur" });
}
```

## 🌐 Support Multi-langues

### Structure pour Multi-langues

```javascript
// lib/translations.js
export const translations = {
  fr: {
    /* traductions françaises */
  },
  en: {
    /* traductions anglaises */
  },
  ar: {
    /* traductions arabes */
  },
};

// lib/i18n.js
export const useTranslation = (locale = "fr") => {
  return { t: (key, params = {}) => t(key, params, locale) };
};
```

### Sélecteur de Langue

```javascript
const LanguageSelector = () => {
  const [locale, setLocale] = useState("fr");

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectItem value="fr">Français</SelectItem>
      <SelectItem value="en">English</SelectItem>
      <SelectItem value="ar">العربية</SelectItem>
    </Select>
  );
};
```

## ✅ Checklist de Traduction

### Avant de Commencer

- [ ] Sauvegarder le code actuel
- [ ] Créer une branche pour la traduction
- [ ] Identifier tous les textes à traduire

### Pendant la Traduction

- [ ] Utiliser le système de traductions centralisé
- [ ] Tester chaque page traduite
- [ ] Vérifier la cohérence des termes
- [ ] Tester avec différents contenus

### Après la Traduction

- [ ] Tester l'application complète
- [ ] Vérifier les formulaires
- [ ] Tester les messages d'erreur
- [ ] Vérifier les notifications
- [ ] Tester l'export/import de données
- [ ] Valider avec des utilisateurs francophones

## 🐛 Dépannage

### Problèmes Courants

#### 1. Texte non traduit

```javascript
// ❌ Incorrect
<h1>Dashboard</h1>

// ✅ Correct
<h1>{t('navigation.dashboard')}</h1>
```

#### 2. Import manquant

```javascript
// ❌ Erreur: t is not defined
const { t } = useTranslation();

// ✅ Correct
import { useTranslation } from "@/lib/translations";
const { t } = useTranslation();
```

#### 3. Clé de traduction manquante

```javascript
// ❌ Affiche la clé au lieu du texte
{
  t("cle.inexistante");
}

// ✅ Ajouter dans lib/translations.js
{
  cle: {
    inexistante: "Texte traduit";
  }
}
```

### Debugging

```javascript
// Activer les logs de traduction
const { t } = useTranslation();

// Log pour debug
console.log("Clé de traduction:", t("ma.cle"));
```

## 📚 Ressources

### Outils Recommandés

- [i18next](https://www.i18next.com/) - Framework de traduction avancé
- [react-i18next](https://react.i18next.com/) - Intégration React
- [Lingui](https://lingui.js.org/) - Alternative moderne

### Bonnes Pratiques

- Utiliser des clés descriptives
- Grouper les traductions par fonctionnalité
- Maintenir la cohérence terminologique
- Tester avec des contenus réels
- Documenter les nouvelles traductions

### Validation

- Faire relire par des francophones natifs
- Tester avec différents contextes
- Vérifier la longueur des textes
- S'assurer de la cohérence culturelle
