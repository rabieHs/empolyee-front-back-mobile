# Portail RH Mobile

Application mobile pour la gestion des demandes des employés, développée avec Flutter.

## Description

Portail RH Mobile est une application qui permet aux employés de :
- Se connecter avec leurs identifiants
- Consulter leurs demandes existantes (congés, maladies, formations, etc.)
- Créer de nouvelles demandes
- Recevoir des notifications concernant le statut de leurs demandes
- Consulter leur profil utilisateur

L'application se connecte à une API backend existante qui stocke toutes les données dans une base de données MySQL.

## Configuration

### Prérequis
- Flutter SDK (version 3.5.0 ou supérieure)
- Dart SDK (version 3.5.0 ou supérieure)
- Un émulateur Android/iOS ou un appareil physique pour tester
- Le serveur backend doit être en cours d'exécution

### Installation

1. Cloner le dépôt :
```bash
git clone [URL_DU_REPO]
cd portail_rh_mobile
```

2. Installer les dépendances :
```bash
flutter pub get
```

3. Configurer l'URL de l'API :
Modifier le fichier `lib/utils/constants.dart` pour définir l'URL correcte de votre API backend.

```dart
static const String baseUrl = 'http://10.0.2.2:3002/api'; // Pour l'émulateur Android
// ou
static const String baseUrl = 'http://localhost:3002/api'; // Pour le développement local
```

4. Lancer l'application :
```bash
flutter run
```

## Structure du projet

- `lib/models/` : Modèles de données (User, Request, Notification)
- `lib/screens/` : Écrans de l'application (login, home, request details, etc.)
- `lib/services/` : Services pour communiquer avec l'API backend
- `lib/providers/` : Providers pour la gestion d'état avec Provider
- `lib/utils/` : Utilitaires et constantes
- `lib/widgets/` : Widgets réutilisables

## Fonctionnalités

### Authentification
- Connexion sécurisée avec JWT
- Stockage sécurisé du token d'authentification

### Gestion des demandes
- Visualisation de toutes les demandes de l'utilisateur
- Création de nouvelles demandes
- Consultation des détails d'une demande

### Notifications
- Liste des notifications
- Marquage des notifications comme lues

### Profil utilisateur
- Affichage des informations personnelles et professionnelles

## Connexion au backend

L'application se connecte à l'API backend via HTTP. Toutes les requêtes authentifiées incluent le token JWT dans l'en-tête d'autorisation.
