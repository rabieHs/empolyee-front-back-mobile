import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/notification.dart' as app_notification;
import '../utils/constants.dart';
import 'auth_service.dart';

class NotificationService {
  final AuthService _authService = AuthService();
  
  // Stream controller pour les notifications en temps réel
  final StreamController<List<app_notification.Notification>> _notificationsController = 
      StreamController<List<app_notification.Notification>>.broadcast();
  
  // Getter pour accéder au stream de notifications
  Stream<List<app_notification.Notification>> get notificationsStream => _notificationsController.stream;
  
  // WebSocket channel
  WebSocketChannel? _channel;
  bool _isConnected = false;
  
  // Singleton pattern
  static final NotificationService _instance = NotificationService._internal();
  
  factory NotificationService() {
    return _instance;
  }
  
  NotificationService._internal() {
    // Initialiser la connexion WebSocket lors de la création du service
    _initWebSocket();
  }
  
  // Initialiser la connexion WebSocket
  Future<void> _initWebSocket() async {
    try {
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();
      
      if (userId == null || token == null) {
        print('Impossible de se connecter au WebSocket: utilisateur non connecté');
        return;
      }
      
      // Connexion au WebSocket avec le token d'authentification
      final wsUrl = Uri.parse('${Constants.wsUrl}/notifications?token=$token&userId=$userId');
      _channel = WebSocketChannel.connect(wsUrl);
      
      // Écouter les messages du WebSocket
      _channel!.stream.listen((message) {
        try {
          final data = jsonDecode(message);
          if (data['type'] == 'notification') {
            // Mettre à jour les notifications
            getUserNotifications();
          }
        } catch (e) {
          print('Erreur lors du traitement du message WebSocket: $e');
        }
      }, onError: (error) {
        print('Erreur WebSocket: $error');
        _isConnected = false;
        // Essayer de se reconnecter après un délai
        Future.delayed(const Duration(seconds: 5), _reconnect);
      }, onDone: () {
        print('Connexion WebSocket fermée');
        _isConnected = false;
        // Essayer de se reconnecter après un délai
        Future.delayed(const Duration(seconds: 5), _reconnect);
      });
      
      _isConnected = true;
      print('Connexion WebSocket établie');
    } catch (e) {
      print('Erreur lors de l\'initialisation du WebSocket: $e');
      _isConnected = false;
      // Essayer de se reconnecter après un délai
      Future.delayed(const Duration(seconds: 5), _reconnect);
    }
  }
  
  // Méthode pour se reconnecter au WebSocket
  Future<void> _reconnect() async {
    if (!_isConnected) {
      print('Tentative de reconnexion au WebSocket...');
      await _initWebSocket();
    }
  }
  
  // Fermer la connexion WebSocket
  Future<void> closeConnection() async {
    if (_channel != null) {
      await _channel!.sink.close(status.goingAway);
      _isConnected = false;
    }
  }
  
  // Récupérer les notifications de l'utilisateur
  Future<List<app_notification.Notification>> getUserNotifications() async {
    try {
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();
      
      if (userId == null || token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.get(
        Uri.parse('${Constants.apiUrl}/notifications/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final notifications = data.map((item) => app_notification.Notification.fromJson(item)).toList();
        
        // Mettre à jour le stream de notifications
        _notificationsController.add(notifications);
        
        return notifications;
      } else {
        throw Exception('Erreur lors de la récupération des notifications: ${response.statusCode}');
      }
    } catch (e) {
      print('Erreur lors de la récupération des notifications: $e');
      // Propager l'erreur pour qu'elle puisse être gérée par l'UI
      throw e;
    }
  }
  
  // Marquer une notification comme lue
  Future<void> markAsRead(String notificationId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.put(
        Uri.parse('${Constants.apiUrl}/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        // Mettre à jour les notifications après avoir marqué une notification comme lue
        await getUserNotifications();
      } else {
        throw Exception('Erreur lors du marquage de la notification comme lue: ${response.statusCode}');
      }
    } catch (e) {
      print('Erreur lors du marquage de la notification comme lue: $e');
      throw e;
    }
  }
  
  // Supprimer toutes les notifications
  Future<void> clearAllNotifications() async {
    try {
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();
      
      if (userId == null || token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.delete(
        Uri.parse('${Constants.apiUrl}/notifications/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        // Mettre à jour les notifications après les avoir supprimées
        _notificationsController.add([]);
      } else {
        throw Exception('Erreur lors de la suppression des notifications: ${response.statusCode}');
      }
    } catch (e) {
      print('Erreur lors de la suppression des notifications: $e');
      throw e;
    }
  }
  
  // Libérer les ressources
  void dispose() {
    closeConnection();
    _notificationsController.close();
  }
}
