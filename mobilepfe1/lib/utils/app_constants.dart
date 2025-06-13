class AppConstants {
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
  static const String userEmailKey = 'user_email';
  static const String userFirstnameKey = 'user_firstname';
  static const String userLastnameKey = 'user_lastname';
  
  // App constants
  static const String appName = 'Portail RH Mobile';
  static const String appVersion = '1.0.0';
  
  // Request types
  static const List<String> requestTypes = [
    'Congé',
    'Formation',
    'Avance sur salaire',
    'Prêt',
    'Attestation de travail',
    'Document administratif',
  ];
  
  // Request statuses
  static const String statusPending = 'pending';
  static const String statusApproved = 'approved';
  static const String statusRejected = 'rejected';
  
  // User roles
  static const String roleUser = 'user';
  static const String roleChef = 'chef';
  static const String roleAdmin = 'admin';
}
