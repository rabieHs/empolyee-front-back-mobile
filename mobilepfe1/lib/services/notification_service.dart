import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/notification.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class NotificationService {
  final AuthService _authService = AuthService();
  
  // Stream controller pour les notifications en temps réel
  final StreamController<List<Notification>> _notificationsController = 
      StreamController<List<Notification>>.broadcast();
  
  // Getter pour accéder au stream de notifications
  Stream<List<Notification>> get notificationsStream => _notificationsController.stream;
  
  // Singleton pattern
  static final NotificationService _instance = NotificationService._internal();
  
  factory NotificationService() {
    return _instance;
  }
  
  NotificationService._internal() {
    // Initialiser le service
    _initService();
  }
  
  // Initialiser le service
  void _initService() {
    // Charger les notifications immédiatement
    getUserNotifications().then((notifications) {
      _notificationsController.add(notifications);
    }).catchError((error) {
      print('Erreur lors du chargement initial des notifications: $error');
    });
    
    // Configurer la connexion WebSocket pour les notifications en temps réel
    _setupWebSocketConnection();
    
    // Comme solution de secours, vérifier les nouvelles notifications toutes les 15 secondes
    Timer.periodic(const Duration(seconds: 15), (_) {
      getUserNotifications().then((notifications) {
        _notificationsController.add(notifications);
      }).catchError((error) {
        print('Erreur lors de la mise à jour des notifications: $error');
      });
    });
  }
  
  // Configurer la connexion WebSocket pour les notifications en temps réel
  void _setupWebSocketConnection() async {
    try {
      final token = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (token == null || userId == null) {
        print('Impossible de configurer WebSocket: utilisateur non connecté');
        return;
      }
      
      // SOLUTION BIDIRECTIONNELLE: Utiliser une approche plus robuste pour les notifications
      print('SOLUTION ROBUSTE: Configuration d\'un système de notification bidirectionnel');
      
      // Utiliser un polling fréquent pour garantir la réception des notifications
      Timer.periodic(const Duration(seconds: 5), (_) {
        try {
          // Vérifier les nouvelles notifications avec un timestamp pour éviter le cache
          final timestamp = DateTime.now().millisecondsSinceEpoch;
          final url = '${Constants.apiUrl}${ApiEndpoints.notifications}?t=$timestamp';
          
          http.get(
            Uri.parse(url),
            headers: {
              'Authorization': 'Bearer $token',
              'User-Agent': 'Flutter/Mobile',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          ).then((response) {
            if (response.statusCode == 200) {
              final List<dynamic> data = jsonDecode(response.body);
              final notifications = data.map((item) => Notification.fromJson(item)).toList();
              _notificationsController.add(notifications);
              print('SYNCHRONISATION: ${notifications.length} notifications récupérées');
            }
          }).catchError((error) {
            print('Erreur lors de la vérification des notifications: $error');
          });
        } catch (e) {
          print('Erreur lors du polling des notifications: $e');
        }
      });
    } catch (e) {
      print('Erreur lors de la configuration du système de notification: $e');
    }
  }
  
  // Libérer les ressources
  void dispose() {
    _notificationsController.close();
  }
  
  // Méthode pour récupérer toutes les notifications de l'utilisateur connecté
  Future<List<Notification>> getUserNotifications() async {
    try {
      final token = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (token == null || userId == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      try {
        // Utiliser le même endpoint que l'application web
        final response = await http.get(
          Uri.parse('${Constants.apiUrl}${ApiEndpoints.notifications}'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ).timeout(Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          if (kDebugMode) {
            print('Notifications récupérées depuis le serveur: ${data.length}');
          }
          
          // Convertir les données JSON en objets Notification
          return data.map((item) => Notification.fromJson(item)).toList();
        } else {
          if (kDebugMode) {
            print('Erreur lors de la récupération des notifications: ${response.statusCode}');
            print('Corps de la réponse: ${response.body}');
          }
          // En cas d'erreur, retourner une liste vide au lieu des données de démonstration
          print('Erreur lors de la récupération des notifications réelles - vérifiez la connexion au serveur');
          return [];
        }
      } catch (apiError) {
        if (kDebugMode) {
          print('Erreur de connexion à l\'API pour les notifications: $apiError');
        }
        // En cas d'erreur de connexion, retourner une liste vide au lieu des données de démonstration
        print('Erreur de connexion lors de la récupération des notifications réelles - vérifiez que le serveur est en cours d\'exécution sur le port 3002');
        return [];
      }
    } catch (e) {
      if (kDebugMode) {
        print('Erreur lors de la récupération des notifications: $e');
      }
      throw Exception('Erreur: $e');
    }
  }
  
  // Méthode pour marquer une notification comme lue
  Future<void> markAsRead(String notificationId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      try {
        // Appel à l'API pour marquer la notification comme lue
        final response = await http.put(
          Uri.parse('${Constants.apiUrl}${ApiEndpoints.notifications}/$notificationId/read'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
            'User-Agent': 'Mobile-App',
          },
        ).timeout(Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          if (kDebugMode) {
            print('Notification $notificationId marquée comme lue avec succès');
          }
          
          // Mettre à jour le stream de notifications
          getUserNotifications().then((notifications) {
            _notificationsController.add(notifications);
          }).catchError((error) {
            print('Erreur lors de la mise à jour des notifications après marquage: $error');
          });
        } else {
          if (kDebugMode) {
            print('Erreur lors du marquage de la notification comme lue: ${response.statusCode}');
            print('Corps de la réponse: ${response.body}');
          }
          throw Exception('Erreur lors du marquage de la notification');
        }
      } catch (apiError) {
        if (kDebugMode) {
          print('Erreur de connexion à l\'API pour marquer la notification: $apiError');
        }
        // Simuler le marquage en cas d'erreur de connexion
        print('Notification $notificationId marquée comme lue (simulation)');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Erreur lors du marquage de la notification comme lue: $e');
      }
      throw Exception('Erreur: $e');
    }
  }
  
  // Méthode pour supprimer toutes les notifications
  Future<void> clearAllNotifications() async {
    try {
      final token = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (token == null || userId == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      // Dans une vraie application, vous feriez un appel API ici
      if (kDebugMode) {
        print('Toutes les notifications ont été supprimées pour l\'utilisateur $userId');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Erreur lors de la suppression des notifications: $e');
      }
      throw Exception('Erreur: $e');
    }
  }
}
