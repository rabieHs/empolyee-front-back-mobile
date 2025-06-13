class Constants {
  // IMPORTANT: URL de base de l'API avec adresse IP du serveur (connecté à la base de données aya_db)
  static const String apiUrl =
      'http://10.0.2.2:3002/api'; // Adresse IP spéciale pour l'émulateur Android
  static const String wsUrl = 'ws://10.0.2.2:3002'; // WebSocket du serveur

  // BACKUP URLs en cas de problème avec l'adresse IP principale
  static const String backupApiUrl =
      'http://10.0.2.2:3002/api'; // Utiliser 10.0.2.2 pour l'émulateur Android
  static const String backupWsUrl =
      'ws://10.0.2.2:3002'; // Utiliser 10.0.2.2 pour l'émulateur Android

  // URLs alternatives pour les tests sur Windows
  static const String windowsApiUrl = 'http://localhost:3002/api';
  static const String windowsWsUrl = 'ws://localhost:3002';

  // Endpoints de l'API
  static const String loginEndpoint = '/auth/login';
  static const String requestsEndpoint = '/requests';
  static const String userRequestsEndpoint = '/requests/user';
  static const String notificationsEndpoint = '/notifications';
  static const String userProfileEndpoint = '/users/profile';
}

class AppConstants {
  static const String appName = 'Portail RH Mobile';
  static const String tokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
}

// Endpoints API communs aux applications web et mobile
class ApiEndpoints {
  static const String login = '/auth/login';
  static const String requests = '/requests';
  static const String userRequests = '/requests/user';
  static const String notifications = '/notifications';
  static const String userProfile = '/users/profile';
  static const String sync =
      '/sync'; // Endpoint pour la synchronisation cross-platform
}
