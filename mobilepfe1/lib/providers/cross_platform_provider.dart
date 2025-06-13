import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/request.dart';
import '../services/cross_platform_service.dart';
import '../services/websocket_service.dart';

/// Provider pour gérer les demandes provenant des applications web et mobile
/// Connecté à la base de données aya_db qui contient la colonne source pour distinguer l'origine des demandes
class CrossPlatformProvider with ChangeNotifier {
  final CrossPlatformService _crossPlatformService = CrossPlatformService();
  final WebSocketService _webSocketService = WebSocketService();
  
  List<Request> _allRequests = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription? _requestsSubscription;
  
  /// Toutes les demandes (web et mobile)
  List<Request> get allRequests => _allRequests;
  
  /// Demandes provenant de l'application web
  List<Request> get webRequests => _allRequests.where((r) => _crossPlatformService.isWebRequest(r)).toList();
  
  /// Demandes provenant de l'application mobile
  List<Request> get mobileRequests => _allRequests.where((r) => _crossPlatformService.isMobileRequest(r)).toList();
  
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasRequests => _allRequests.isNotEmpty;
  
  /// Constructeur avec liaison directe en temps réel via WebSocket
  CrossPlatformProvider() {
    // Charger les demandes au démarrage
    fetchAllSourceRequests();
    
    // Initialiser la connexion WebSocket
    _initWebSocket();
  }
  
  /// Initialise la connexion WebSocket pour une liaison directe en temps réel
  Future<void> _initWebSocket() async {
    try {
      // Se connecter au WebSocket
      await _webSocketService.connect();
      
      // S'abonner au flux de demandes en temps réel
      _requestsSubscription?.cancel(); // Annuler l'abonnement précédent s'il existe
      _requestsSubscription = _webSocketService.requestsStream.listen((requestsData) {
        if (kDebugMode) {
          print('Nouvelles demandes reçues via WebSocket: ${requestsData.length}');
        }
        
        try {
          // Convertir les données JSON en objets Request
          final List<Request> newRequests = requestsData
              .map((data) => Request.fromJson(data))
              .toList();
          
          // Mettre à jour la liste des demandes
          _allRequests = newRequests;
          _error = null; // Réinitialiser l'erreur si la connexion fonctionne
          notifyListeners();
        } catch (e) {
          if (kDebugMode) {
            print('Erreur lors du traitement des données WebSocket: $e');
          }
        }
      }, onError: (error) {
        if (kDebugMode) {
          print('Erreur dans le flux WebSocket: $error');
        }
        // Tenter de se reconnecter après une erreur
        _reconnectWebSocket();
      });
      
      // Demander les demandes au serveur
      _webSocketService.requestAllRequests();
    } catch (e) {
      if (kDebugMode) {
        print('Erreur lors de l\'initialisation WebSocket: $e');
      }
      // Tenter de se reconnecter après une erreur
      _reconnectWebSocket();
    }
  }
  
  /// Méthode pour tenter de se reconnecter au WebSocket après un délai
  void _reconnectWebSocket() {
    Future.delayed(Duration(seconds: 3), () {
      if (kDebugMode) {
        print('Tentative de reconnexion au WebSocket...');
      }
      _initWebSocket();
    });
  }
  
  @override
  void dispose() {
    _requestsSubscription?.cancel();
    _webSocketService.dispose();
    super.dispose();
  }
  
  /// Récupérer les demandes de toutes les sources depuis la base de données aya_db
  /// Cette méthode utilise à la fois le WebSocket pour une liaison directe et l'API REST comme fallback
  Future<void> fetchAllSourceRequests({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }
    _error = null;
    
    try {
      // 1. Vérifier si le WebSocket est connecté, sinon tenter de le connecter
      if (!_webSocketService.isConnected) {
        if (kDebugMode) {
          print('WebSocket non connecté, tentative de connexion...');
        }
        await _webSocketService.connect();
      }
      
      // 2. Si le WebSocket est connecté, l'utiliser pour une liaison directe en temps réel
      if (_webSocketService.isConnected) {
        if (kDebugMode) {
          print('Demande des données via WebSocket...');
        }
        // Demander une mise à jour des demandes via WebSocket
        _webSocketService.requestAllRequests();
        
        // Attendre un court instant pour laisser le temps au WebSocket de répondre
        await Future.delayed(Duration(milliseconds: 500));
      }
      
      // 3. Si aucune demande n'a été reçue via WebSocket ou si le WebSocket n'est pas connecté,
      // utiliser l'API REST comme fallback
      if (!_webSocketService.isConnected || _allRequests.isEmpty) {
        if (kDebugMode) {
          print('Utilisation de l\'API REST comme fallback...');
        }
        
        try {
          final requests = await _crossPlatformService.getAllSourceRequests();
          
          if (requests.isNotEmpty) {
            _allRequests = requests;
            if (kDebugMode) {
              print('${requests.length} demandes récupérées via API REST');
            }
          } else if (kDebugMode) {
            print('Aucune demande récupérée via API REST');
          }
        } catch (restError) {
          if (kDebugMode) {
            print('Erreur lors de la récupération via API REST: $restError');
          }
          // Si les deux méthodes échouent et qu'aucune demande n'est déjà chargée, propager l'erreur
          if (_allRequests.isEmpty) {
            throw restError;
          }
        }
      }
    } catch (e) {
      _error = e.toString();
      if (kDebugMode) {
        print('Erreur lors de la récupération des demandes: $_error');
      }
      // Tenter de reconnecter le WebSocket après une erreur
      _reconnectWebSocket();
    } finally {
      if (!silent) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }
  
  /// Méthode dédiée pour rafraîchir les demandes en temps réel via WebSocket
  Future<void> refreshRequestsRealtime() async {
    if (kDebugMode) {
      print('Rafraîchissement des demandes en temps réel...');
    }
    
    // Vérifier et rafraîchir la connexion WebSocket si nécessaire
    bool isConnected = await _webSocketService.checkAndRefreshConnection();
    
    // Si le WebSocket est connecté, demander les demandes en temps réel
    if (isConnected) {
      if (kDebugMode) {
        print('Demande des données en temps réel via WebSocket...');
      }
      _webSocketService.requestAllRequests();
      
      // Attendre un court instant pour laisser le temps au WebSocket de répondre
      await Future.delayed(Duration(milliseconds: 300));
      
      // Si aucune donnée n'a été reçue après le délai, utiliser l'API REST comme fallback
      if (_allRequests.isEmpty) {
        if (kDebugMode) {
          print('Aucune donnée reçue via WebSocket, utilisation de l\'API REST comme fallback...');
        }
        await fetchAllSourceRequests(silent: true);
      }
    } else {
      // Si le WebSocket n'est pas connecté, utiliser l'API REST comme fallback
      if (kDebugMode) {
        print('WebSocket non connecté, utilisation de l\'API REST comme fallback...');
      }
      await fetchAllSourceRequests(silent: true);
    }
  }
  
  /// Filtre les demandes par type
  List<Request> filterByType(List<Request> requests, String type) {
    return requests.where((request) => request.type == type).toList();
  }
  
  /// Filtre les demandes par statut
  List<Request> filterByStatus(List<Request> requests, String status) {
    return requests.where((request) => request.status == status).toList();
  }
  
  // La méthode refreshRequestsRealtime est déjà définie plus haut dans le fichier
}
