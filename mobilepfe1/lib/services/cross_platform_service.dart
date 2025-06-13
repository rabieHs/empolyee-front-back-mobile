import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/request.dart';
import 'auth_service.dart';
import 'sync_service.dart';

/// Service pour assurer la compatibilité entre les applications web et mobile
/// Connecté à la base de données aya_db qui contient la colonne source pour distinguer l'origine des demandes
class CrossPlatformService {
  final AuthService _authService = AuthService();
  final SyncService _syncService = SyncService();
  
  /// Récupère les demandes de toutes les sources (web et mobile) depuis la base de données aya_db
  /// Garantit une liaison en temps réel entre les applications web et mobile
  Future<List<Request>> getAllSourceRequests() async {
    try {
      // Vérifier si l'utilisateur est authentifié
      final token = await _authService.getToken();
      if (token == null) {
        print('Utilisateur non authentifié - impossible de récupérer les demandes');
        return [];
      }
      
      // Utiliser le service de synchronisation pour récupérer les demandes des deux applications
      // Aucune donnée de test n'est ajoutée - uniquement des données réelles de la base aya_db
      List<Request> requests = await _syncService.fetchCrossPlatformRequests();
      
      // Log informatif si aucune demande n'est trouvée
      if (requests.isEmpty) {
        print('Aucune demande trouvée dans la base de données aya_db - vérifiez la connexion au serveur');
      }
      
      // S'assurer que toutes les demandes ont une source définie
      final processedRequests = requests.map((request) {
        // Si la source n'est pas définie ou est incorrecte, déterminer la source en fonction des méthodes spécialisées
        if (request.source == null || (request.source != 'web' && request.source != 'mobile')) {
          // Utiliser les méthodes spécialisées pour déterminer la source
          bool isWeb = isWebRequest(request);
          
          // Ajouter des logs pour déboguer
          print('DIAGNOSTIC SOURCE: Demande ID=${request.id}, Type=${request.type}');
          print('DIAGNOSTIC SOURCE: Détection source=${isWeb ? "WEB" : "MOBILE"}');
          if (request.details != null) {
            print('DIAGNOSTIC SOURCE: Détails=${request.details}');
          }
          if (request.description != null) {
            print('DIAGNOSTIC SOURCE: Description=${request.description}');
          }
          
          // Créer une nouvelle demande avec la source déterminée
          return Request(
            id: request.id,
            userId: request.userId,
            type: request.type,
            status: request.status,
            startDate: request.startDate,
            endDate: request.endDate,
            description: request.description,
            details: request.details,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            firstname: request.firstname,
            lastname: request.lastname,
            email: request.email,
            role: request.role,
            department: request.department,
            position: request.position,
            source: isWeb ? 'web' : 'mobile',
          );
        }
        return request;
      }).toList();
      
      // Statistiques des demandes non affichées en production
      
      return processedRequests;
    } catch (e) {
      print('Erreur lors de la récupération des demandes cross-platform: $e');
      
      // Analyser l'erreur pour fournir des informations plus précises
      String errorMessage = e.toString();
      
      // Erreur de connexion au serveur
      if (errorMessage.contains('SocketException') || 
          errorMessage.contains('Connection refused') ||
          errorMessage.contains('Connection timed out')) {
        print('Erreur de connexion au serveur. Vérifiez que le serveur est en cours d\'exécution sur le port 3002.');
      }
      
      // Erreur d'authentification
      else if (errorMessage.contains('401') || 
               errorMessage.contains('403') || 
               errorMessage.contains('Token invalide') ||
               errorMessage.contains('Unauthorized')) {
        print('Erreur d\'authentification. Votre session a peut-être expiré. Veuillez vous reconnecter.');
      }
      
      // Erreur d'URL incorrecte
      else if (errorMessage.contains('Invalid URL') ||
               errorMessage.contains('No host specified')) {
        print('URL incorrecte. Vérifiez les constantes dans constants.dart et assurez-vous que 10.0.2.2 est utilisé pour l\'API et le WebSocket.');
      }
      
      return [];
    }
  }
  
  /// Vérifie si une demande provient de l'application mobile
  bool isMobileRequest(Request request) {
    // Si la source est explicitement définie comme mobile
    if (request.source == 'mobile') {
      return true;
    }
    
    // Vérifier si la demande a des caractéristiques spécifiques au mobile
    if (request.details != null) {
      // Vérifier si la demande a été créée depuis l'application mobile
      if (request.details!.containsKey('created_from') && 
          request.details!['created_from'].toString().toLowerCase() == 'mobile') {
        return true;
      }
      
      // Vérifier si la demande a été créée par l'interface mobile
      if (request.details!.containsKey('interface') && 
          request.details!['interface'].toString().toLowerCase() == 'mobile') {
        return true;
      }
    }
    
    // Par défaut, ne pas considérer comme mobile si aucun critère n'est rempli
    return false;
  }
  
  /// Vérifie si une demande provient de l'application web
  bool isWebRequest(Request request) {
    // Si c'est une demande mobile, ce n'est pas une demande web
    if (isMobileRequest(request)) {
      return false;
    }
    
    // Vérifier explicitement la source
    if (request.source == 'web') {
      return true;
    }
    
    // Vérifier les caractéristiques spécifiques aux demandes web
    
    // 1. Vérifier l'ID de la demande selon les formats spécifiques
    // Format des IDs web: nombres à 10 chiffres, req-*, ou format UUID
    if (request.id.startsWith('req-') || 
        request.id.contains('-') || // Format UUID typique des applications web
        request.id.length == 10 && !request.id.contains('_') ||
        RegExp(r'^\d{10,13}$').hasMatch(request.id)) {
      return true;
    }
    
    // 2. Vérifier les détails de la demande
    if (request.details != null) {
      if (request.details!.containsKey('source') && 
          request.details!['source'].toString().toLowerCase() == 'web') {
        return true;
      }
      
      // Vérifier si la demande a été créée par l'interface web
      if (request.details!.containsKey('interface') && 
          request.details!['interface'].toString().toLowerCase() == 'web') {
        return true;
      }
      
      // Vérifier si la demande a été traitée par un administrateur (typique du web)
      if (request.details!.containsKey('traitePar')) {
        String traitePar = request.details!['traitePar'].toString().toLowerCase();
        if (traitePar.contains('admin') || traitePar.contains('chef')) {
          return true;
        }
      }
    }
    
    // 3. Vérifier la description de la demande
    if (request.description != null && request.description.isNotEmpty) {
      // Format spécifique aux demandes web: "Congé du YYYY-MM-DD au YYYY-MM-DD (X jours ouvrables)"
      if ((request.description.contains('jours') && 
          RegExp(r'\d{4}-\d{2}-\d{2}').hasMatch(request.description)) ||
          request.description.contains('web')) {
        return true;
      }
    }
    
    // 4. Vérifier le format de la date de création
    if (request.createdAt != null && request.createdAt!.contains('T')) {
      // Format ISO typique des applications web: "2025-03-12T14:30:00.000Z"
      return true;
    }
    
    // Par défaut, considérer comme une demande web si elle n'est pas explicitement mobile
    // Cette ligne est importante car la plupart des demandes web n'ont pas de marquage explicite
    return true;
  }
}
