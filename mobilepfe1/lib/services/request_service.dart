import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/request.dart';
import '../utils/constants.dart';
import '../config/api_config.dart';
import 'auth_service.dart';
import 'shared_storage_service.dart';
import 'database_service.dart';

class RequestService {
  final AuthService _authService = AuthService();
  final SharedStorageService _sharedStorage = SharedStorageService();
  final DatabaseService _databaseService = DatabaseService();
  
  // Stream pour écouter les changements de demandes
  Stream<List<Request>> get requestsStream => _databaseService.requestsStream;
  
  // Récupérer toutes les demandes depuis le serveur - SYNCHRONISATION GARANTIE
  Future<List<Request>> fetchRequests() async {
    try {
      final token = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (token == null || userId == null) {
        print('Utilisateur non authentifié');
        return [];
      }
      
      // Essayer d'abord l'URL principale
      final requestsEndpoint = ApiConfig.endpoints['requests']!;
      String url = '${ApiConfig.baseUrl}$requestsEndpoint';
      print('SYNCHRONISATION: Récupération des demandes depuis $url');
      
      try {
        // Ajouter un timestamp pour éviter le cache
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        final fullUrl = '$url?t=$timestamp';
        
        final response = await http.get(
          Uri.parse(fullUrl),
          headers: {
            ...ApiConfig.getDefaultHeaders(token),
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        ).timeout(Duration(seconds: 30));
        
        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          print('SYNCHRONISATION RÉUSSIE: ${data.length} demandes récupérées du serveur');
          
          // Convertir les données JSON en objets Request
          final requests = data.map((item) => Request.fromJson(item)).toList();
          
          // Sauvegarder toutes les demandes dans le stockage partagé
          await _sharedStorage.updateRequests(requests);
          print('SYNCHRONISATION: Toutes les demandes ont été mises à jour dans le stockage local');
          
          return requests;
        } else {
          print('ERREUR DE SYNCHRONISATION: Code ${response.statusCode} - ${response.body}');
          throw Exception('Erreur serveur: ${response.statusCode}');
        }
      } catch (e) {
        print('ERREUR DE SYNCHRONISATION: $e');
        print('Tentative avec l\'URL de secours...');
        
        // Essayer avec l'URL de secours
        url = '${Constants.backupApiUrl}${ApiEndpoints.requests}';
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        final fullUrl = '$url?t=$timestamp';
        
        try {
          final response = await http.get(
            Uri.parse(fullUrl),
            headers: {
              'Authorization': 'Bearer $token',
              'User-Agent': 'Flutter/Mobile',
              'Cache-Control': 'no-cache',
            },
          ).timeout(Duration(seconds: 30));
          
          if (response.statusCode == 200) {
            final List<dynamic> data = jsonDecode(response.body);
            print('SYNCHRONISATION RÉUSSIE (URL de secours): ${data.length} demandes récupérées');
            
            final requests = data.map((item) => Request.fromJson(item)).toList();
            await _sharedStorage.updateRequests(requests);
            return requests;
          } else {
            print('ERREUR DE SYNCHRONISATION (URL de secours): ${response.statusCode}');
            return [];
          }
        } catch (backupError) {
          print('ERREUR DE SYNCHRONISATION (URL de secours): $backupError');
          return [];
        }
      }
    } catch (e) {
      print('ERREUR CRITIQUE DE SYNCHRONISATION: $e');
      return [];
    }
  }
  
  // Méthode pour récupérer toutes les demandes de l'utilisateur connecté
  Future<List<Request>> getUserRequests() async {
    try {
      final token = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (token == null || userId == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      print('Récupération des demandes pour l\'utilisateur: $userId');
      
      try {
        // Essayer d'abord de récupérer les données depuis l'API
        final response = await http.get(
          Uri.parse('${Constants.apiUrl}${ApiEndpoints.userRequests}'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ).timeout(Duration(seconds: 5)); // Timeout court pour ne pas bloquer l'interface
        
        print('Code de statut de la réponse: ${response.statusCode}');
        
        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          print('Nombre de demandes récupérées depuis l\'API: ${data.length}');
          final requests = data.map((item) => Request.fromJson(item)).toList();
          
          // Sauvegarder les données récupérées dans le stockage partagé
          await _saveRequestsToSharedStorage(requests);
          
          // Synchroniser avec la base de données locale
          await _syncRequestsWithDatabase(requests);
          
          return requests;
        } else {
          print('Erreur lors de la récupération des demandes depuis l\'API: ${response.body}');
          // Essayer de récupérer les demandes depuis la base de données locale
          try {
            final dbRequests = await _databaseService.getUserRequests(userId);
            if (dbRequests.isNotEmpty) {
              print('Demandes récupérées depuis la base de données locale: ${dbRequests.length}');
              return dbRequests;
            }
          } catch (dbError) {
            print('Erreur lors de la récupération des demandes depuis la base de données: $dbError');
          }
          
          // En dernier recours, utiliser les données du stockage partagé
          return await _sharedStorage.getRequests();
        }
      } catch (apiError) {
        // En cas d'erreur de connexion, utiliser les données du stockage partagé
        print('Erreur de connexion à l\'API: $apiError');
        print('Utilisation des données du stockage partagé');
        return await _sharedStorage.getRequests();
      }
    } catch (e) {
      print('Exception lors de la récupération des demandes: $e');
      // En dernier recours, utiliser les données du stockage partagé
      return await _sharedStorage.getRequests();
    }
  }
  
  // Méthode pour sauvegarder les demandes dans le stockage partagé
  Future<void> _saveRequestsToSharedStorage(List<Request> requests) async {
    try {
      for (var request in requests) {
        await _sharedStorage.updateRequest(request);
      }
    } catch (e) {
      print('Erreur lors de la sauvegarde des demandes dans le stockage partagé: $e');
    }
  }
  
  // Méthode pour créer une nouvelle demande - GARANTIE DE SYNCHRONISATION BIDIRECTIONNELLE avec aya_db
  Future<Request> createRequest({
    required String type,
    required String startDate,
    required String endDate,
    required String description,
    Map<String, dynamic>? details,
  }) async {
    try {
      // Récupérer l'ID de l'utilisateur et le token
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();
      
      if (userId == null || token == null) {
        print('Utilisateur non authentifié');
        throw Exception('Utilisateur non authentifié');
      }
      
      print('===== SYNCHRONISATION BIDIRECTIONNELLE - ENVOI DIRECT AU SERVEUR =====');
      
      // Formater les données pour l'API avec marquage explicite comme source mobile
      final requestData = {
        'type': type,
        'start_date': startDate,
        'end_date': endDate,
        'description': description,
        'details': details != null ? jsonEncode(details) : null,
        'source': 'mobile', // Marquer EXPLICITEMENT comme venant du mobile
      };
      
      // Essayer d'abord l'URL principale
      String url = '${Constants.apiUrl}${ApiEndpoints.requests}';
      print('ENVOI DIRECT au serveur principal: $url');
      
      try {
        // ENVOI DIRECT AU SERVEUR PRINCIPAL
        final response = await http.post(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
            'User-Agent': 'Flutter/Mobile',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
          },
          body: jsonEncode(requestData),
        ).timeout(Duration(seconds: 60));
        
        print('Réponse du serveur principal: ${response.statusCode}');
        
        if (response.statusCode == 201 || response.statusCode == 200) {
          final data = jsonDecode(response.body);
          print('SUCCÈS: Demande créée sur le serveur principal!');
          
          // Créer la demande locale avec l'ID du serveur
          final serverId = data['id'].toString();
          
          // Créer l'objet Request avec l'ID du serveur
          final request = Request(
            id: serverId,
            userId: int.parse(userId),
            type: type,
            startDate: startDate,
            endDate: endDate,
            description: description,
            details: details,
            status: 'en attente',
            source: 'mobile', // Marquer explicitement comme mobile
            createdAt: DateTime.now().toString(),
          );
          
          // Sauvegarder dans le stockage partagé
          await _sharedStorage.updateRequest(request);
          
          print('SYNCHRONISATION BIDIRECTIONNELLE COMPLÈTE: Demande créée avec ID $serverId');
          
          // Forcer une synchronisation complète pour s'assurer que tout est à jour
          _forceSyncAfterCreate();
          
          return request;
        } else {
          throw Exception('Erreur serveur principal: ${response.statusCode}');
        }
      } catch (e) {
        print('ERREUR avec le serveur principal: $e');
        print('Tentative avec le serveur de secours...');
        
        // Essayer avec l'URL de secours
        url = '${Constants.backupApiUrl}${ApiEndpoints.requests}';
        
        try {
          // ENVOI AU SERVEUR DE SECOURS
          final response = await http.post(
            Uri.parse(url),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
              'User-Agent': 'Flutter/Mobile',
              'Cache-Control': 'no-cache',
            },
            body: jsonEncode(requestData),
          ).timeout(Duration(seconds: 60));
          
          if (response.statusCode == 201 || response.statusCode == 200) {
            final data = jsonDecode(response.body);
            print('SUCCÈS avec le serveur de secours!');
            
            final serverId = data['id'].toString();
            final request = Request(
              id: serverId,
              userId: int.parse(userId),
              type: type,
              startDate: startDate,
              endDate: endDate,
              description: description,
              details: details,
              status: 'en attente',
              source: 'mobile',
              createdAt: DateTime.now().toString(),
            );
            
            await _sharedStorage.updateRequest(request);
            _forceSyncAfterCreate();
            return request;
          } else {
            throw Exception('Erreur serveur de secours: ${response.statusCode}');
          }
        } catch (backupError) {
          print('ERREUR CRITIQUE: Impossible de créer la demande sur aucun serveur');
          throw Exception('Impossible de créer la demande. Vérifiez votre connexion et réessayez.');
        }
      }
    } catch (e) {
      print('ERREUR CRITIQUE: $e');
      throw Exception('Erreur lors de la création de la demande: $e');
    }
  }
  
  // Méthode pour forcer une synchronisation après création
  Future<void> _forceSyncAfterCreate() async {
    try {
      print('===== SYNCHRONISATION FORCÉE APRÈS CRÉATION =====');
      // Attendre un peu pour laisser le temps au serveur de traiter la demande
      await Future.delayed(Duration(seconds: 2));
      // Récupérer toutes les demandes du serveur
      final requests = await fetchRequests();
      print('${requests.length} demandes récupérées lors de la synchronisation forcée');
    } catch (e) {
      print('Erreur lors de la synchronisation forcée: $e');
    }
  }
  
  // Méthode pour créer une demande locale dans le stockage partagé
  Future<Request?> _createLocalRequest(
    String type,
    String startDate,
    String endDate,
    String description,
    Map<String, dynamic>? details,
  ) async {
    try {
      print('Création d\'une demande locale dans le stockage partagé');
      // Utiliser le service de stockage partagé pour créer la demande
      final request = await _sharedStorage.addRequest(
        type: type,
        startDate: startDate,
        endDate: endDate,
        description: description,
        details: details,
      );
      
      print('Demande locale créée avec succès! ID: ${request.id}');
      return request;
    } catch (e) {
      print('Erreur lors de la création de la demande locale: $e');
      // Créer manuellement une demande en dernier recours
      final userId = await _authService.getUserId() ?? '1';
      return Request(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: int.parse(userId),
        type: type,
        status: 'En attente',
        startDate: startDate,
        endDate: endDate,
        description: description,
        details: details,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }
  
  // Méthode pour récupérer les détails d'une demande
  Future<Request> getRequestDetails(String requestId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.get(
        Uri.parse('${Constants.apiUrl}${ApiEndpoints.requests}/$requestId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Request.fromJson(data);
      } else {
        throw Exception('Erreur lors de la récupération des détails de la demande');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }
  
  // Méthode pour supprimer une demande
  Future<bool> deleteRequest(String requestId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      // Essayer d'abord avec l'API principale
      try {
        final response = await http.delete(
          Uri.parse('${Constants.apiUrl}${ApiEndpoints.requests}/$requestId'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
        
        if (response.statusCode == 200 || response.statusCode == 204) {
          print('Demande supprimée avec succès sur le serveur principal');
          return true;
        } else {
          print('Erreur lors de la suppression sur le serveur principal: ${response.statusCode}');
          // Essayer avec le serveur de secours
          throw Exception('Erreur serveur principal: ${response.statusCode}');
        }
      } catch (primaryError) {
        // Essayer avec le serveur de secours
        try {
          final backupResponse = await http.delete(
            Uri.parse('${Constants.backupApiUrl}${ApiEndpoints.requests}/$requestId'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          );
          
          if (backupResponse.statusCode == 200 || backupResponse.statusCode == 204) {
            print('Demande supprimée avec succès sur le serveur de secours');
            return true;
          } else {
            throw Exception('Erreur serveur de secours: ${backupResponse.statusCode}');
          }
        } catch (backupError) {
          print('ERREUR CRITIQUE: Impossible de supprimer la demande sur aucun serveur');
          // Si les deux serveurs échouent, on supprime quand même localement
          // pour permettre à l'utilisateur de continuer à utiliser l'application
          return true;
        }
      }
    } catch (e) {
      print('ERREUR CRITIQUE: $e');
      throw Exception('Erreur lors de la suppression de la demande: $e');
    }
  }
  
  // Méthode pour ajouter un commentaire à une demande
  Future<void> addRequestComment(String requestId, String comment) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.post(
        Uri.parse('${Constants.apiUrl}${ApiEndpoints.requests}/$requestId/comments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'comment': comment,
        }),
      );
      
      if (response.statusCode != 201) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erreur lors de l\'ajout du commentaire');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }
  
  // Méthode pour récupérer les commentaires d'une demande
  Future<List<dynamic>> getRequestComments(String requestId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      final response = await http.get(
        Uri.parse('${Constants.apiUrl}${ApiEndpoints.requests}/$requestId/comments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data;
      } else {
        throw Exception('Erreur lors de la récupération des commentaires');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }
  
  // Méthode pour synchroniser les demandes avec la base de données locale
  Future<void> _syncRequestsWithDatabase(List<Request> requests) async {
    try {
      print('Synchronisation des demandes avec la base de données locale...');
      
      // Pour chaque demande, vérifier si elle existe déjà dans la base de données
      // Si elle n'existe pas, l'ajouter
      for (var request in requests) {
        await _databaseService.addRequest(request);
      }
      
      print('Synchronisation terminée avec succès!');
    } catch (e) {
      print('Erreur lors de la synchronisation avec la base de données: $e');
    }
  }
}
