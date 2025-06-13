import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../utils/constants.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class WebSocketService {
  IO.Socket? _socket;
  final AuthService _authService = AuthService();
  final StreamController<Map<String, dynamic>> _notificationsController = StreamController<Map<String, dynamic>>.broadcast();
  
  // Nouveau contrôleur pour les demandes en temps réel
  final StreamController<List<dynamic>> _requestsController = StreamController<List<dynamic>>.broadcast();
  
  Stream<Map<String, dynamic>> get notificationsStream => _notificationsController.stream;
  // Nouveau flux pour les demandes en temps réel
  Stream<List<dynamic>> get requestsStream => _requestsController.stream;
  
  bool _isConnected = false;
  
  bool get isConnected => _isConnected;
  
  // Méthode pour se connecter au WebSocket
  Future<void> connect() async {
    if (_isConnected) return;
    
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        if (kDebugMode) {
          print('Impossible de se connecter au Socket.IO: Token manquant');
        }
        return;
      }
      
      // Déterminer l'URL WebSocket appropriée pour l'émulateur Android
      String wsUrl = ApiConfig.wsUrl;
      
      if (kDebugMode) {
        print('Tentative de connexion WebSocket à: $wsUrl');
      }
      
      // Initialiser le Socket.IO avec les options
      _socket = IO.io(wsUrl, {
        'transports': ['websocket'],
        'autoConnect': false,
        'extraHeaders': {'Authorization': 'Bearer $token'},
        'reconnection': true,
        'reconnectionDelay': 1000,
        'reconnectionDelayMax': 5000,
        'reconnectionAttempts': 10
      });
      
      // Gestion des événements Socket.IO
      _socket!.onConnect((_) async {
        if (kDebugMode) {
          print('Socket.IO connecté');
        }
        _isConnected = true;
        
        // Récupérer les informations utilisateur pour l'authentification
        final userId = await _authService.getUserId();
        final userRole = await _authService.getUserRole();
        
        if (userId != null) {
          // Authentifier l'utilisateur sur le socket
          _socket!.emit('authenticate', {
            'userId': userId,
            'role': userRole ?? 'user',
          });
          
          if (kDebugMode) {
            print('Utilisateur authentifié sur WebSocket: $userId');
          }
          
          // Demander immédiatement les demandes après connexion
          requestAllRequests();
        }
      });
      
      _socket!.onDisconnect((_) {
        if (kDebugMode) {
          print('Socket.IO déconnecté');
        }
        _isConnected = false;
        _reconnect();
      });
      
      _socket!.onError((error) {
        if (kDebugMode) {
          print('Erreur Socket.IO: $error');
        }
        _isConnected = false;
      });
      
      // Écouter les notifications
      _socket!.on('notification', (data) {
        if (kDebugMode) {
          print('Notification reçue: $data');
        }
        if (data is Map) {
          _notificationsController.add(Map<String, dynamic>.from(data));
        }
      });
      
      // Écouter les notifications non lues
      _socket!.on('unread_notifications', (data) {
        if (kDebugMode) {
          print('Notifications non lues reçues: $data');
        }
        if (data is List) {
          for (var notification in data) {
            if (notification is Map) {
              _notificationsController.add(Map<String, dynamic>.from(notification));
            }
          }
        }
      });
      
      // Écouter les mises à jour des demandes en temps réel
      _socket!.on('requests_update', (data) {
        if (kDebugMode) {
          print('Mise à jour des demandes reçue: $data');
        }
        if (data is List) {
          _requestsController.add(data);
        }
      });
      
      // Écouter les nouvelles demandes
      _socket!.on('new_request', (data) {
        if (kDebugMode) {
          print('Nouvelle demande reçue: $data');
        }
        // Demander une mise à jour complète des demandes
        _socket!.emit('get_requests', {});
      });
      
      // Écouter les mises à jour de statut des demandes
      _socket!.on('request_status_update', (data) {
        if (kDebugMode) {
          print('Mise à jour du statut d\'une demande: $data');
        }
        // Demander une mise à jour complète des demandes
        _socket!.emit('get_requests', {});  
      });
      
      // Se connecter au serveur
      _socket!.connect();
      
    } catch (e) {
      if (kDebugMode) {
        print('Erreur lors de la connexion au Socket.IO: $e');
      }
      _isConnected = false;
      // Tenter de se reconnecter après un délai
      _reconnect();
    }
  }
  
  // Méthode pour se reconnecter au Socket.IO après un délai
  void _reconnect() {
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected && _socket != null) {
        _socket!.connect();
      } else if (!_isConnected) {
        connect();
      }
    });
  }
  
  // Méthode pour envoyer un message au Socket.IO
  void send(String event, Map<String, dynamic> data) {
    if (_isConnected && _socket != null) {
      _socket!.emit(event, data);
    }
  }
  
  // Méthode pour demander explicitement les demandes au serveur
  void requestAllRequests() {
    if (_isConnected && _socket != null) {
      if (kDebugMode) {
        print('Demande de toutes les demandes au serveur via WebSocket');
      }
      _socket!.emit('get_requests', {});
    } else {
      if (kDebugMode) {
        print('Impossible de demander les demandes: WebSocket non connecté');
      }
      // Tenter de se reconnecter
      connect();
    }
  }
  
  // Méthode pour fermer la connexion Socket.IO
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _isConnected = false;
    }
  }
  
  /// Vérifie l'état de la connexion WebSocket et tente de se reconnecter si nécessaire
  Future<bool> checkAndRefreshConnection() async {
    if (!_isConnected) {
      if (kDebugMode) {
        print('WebSocket non connecté, tentative de reconnexion...');
      }
      await connect();
      // Attendre un court instant pour laisser le temps à la connexion de s'établir
      await Future.delayed(Duration(milliseconds: 500));
      return _isConnected;
    }
    return true;
  }
  
  // Méthode pour disposer des ressources
  void dispose() {
    disconnect();
    _notificationsController.close();
    _requestsController.close();
  }
}
