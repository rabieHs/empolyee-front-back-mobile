import 'dart:io';
import 'package:flutter/foundation.dart';
import '../utils/constants.dart';

/// Configuration des API pour l'application
class ApiConfig {
  /// URL de base pour les appels API
  static String get baseUrl {
    if (kIsWeb) {
      return Constants.apiUrl;
    } else if (Platform.isWindows) {
      return Constants.windowsApiUrl;
    } else if (Platform.isAndroid) {
      return Constants.apiUrl;
    } else {
      return Constants.apiUrl;
    }
  }
  
  /// URL de secours pour les appels API
  static String get backupBaseUrl {
    if (kIsWeb) {
      return Constants.backupApiUrl;
    } else if (Platform.isWindows) {
      return Constants.backupApiUrl;
    } else if (Platform.isAndroid) {
      return Constants.backupApiUrl;
    } else {
      return Constants.backupApiUrl;
    }
  }
  
  /// URL pour les WebSockets
  static String get wsUrl {
    if (kIsWeb) {
      return Constants.wsUrl;
    } else if (Platform.isWindows) {
      return Constants.windowsWsUrl;
    } else if (Platform.isAndroid) {
      return Constants.wsUrl;
    } else {
      return Constants.wsUrl;
    }
  }
  
  /// URL de secours pour les WebSockets
  static String get backupWsUrl {
    if (kIsWeb) {
      return Constants.backupWsUrl;
    } else if (Platform.isWindows) {
      return Constants.backupWsUrl;
    } else if (Platform.isAndroid) {
      return Constants.backupWsUrl;
    } else {
      return Constants.backupWsUrl;
    }
  }
  
  /// Endpoints de l'API
  static final Map<String, String> endpoints = {
    'login': ApiEndpoints.login,
    'register': '/auth/register',
    'requests': ApiEndpoints.requests,
    'userRequests': ApiEndpoints.userRequests,
    'notifications': ApiEndpoints.notifications,
    'userProfile': ApiEndpoints.userProfile,
    'calendar': '/calendar',
    'calendarEvents': '/calendar-events',
    'users': '/users',
    'sync': '/sync',
    'crossPlatformRequests': '/api/cross-platform-requests',
  };
  
  /// Headers par défaut pour les requêtes API
  static Map<String, String> getDefaultHeaders(String? token) {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Flutter/Mobile',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
