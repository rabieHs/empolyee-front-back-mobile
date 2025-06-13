import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/request.dart';
import '../config/api_config.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class SyncService {
  // Utiliser les URLs spécifiques à la plateforme
  String get baseUrl {
    if (kIsWeb) {
      return ApiConfig.baseUrl;
    } else if (Platform.isWindows) {
      return Constants.windowsApiUrl;
    } else if (Platform.isAndroid) {
      return Constants.apiUrl;
    } else {
      return ApiConfig.baseUrl;
    }
  }
  
  String get backupBaseUrl {
    if (kIsWeb) {
      return ApiConfig.backupBaseUrl;
    } else if (Platform.isWindows) {
      return Constants.backupApiUrl;
    } else if (Platform.isAndroid) {
      return Constants.backupApiUrl;
    } else {
      return ApiConfig.backupBaseUrl;
    }
  }
  
  final AuthService _authService = AuthService();

  /// Synchronise les demandes entre l'application mobile et le backend
  Future<Map<String, dynamic>> synchronizeRequests() async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        return {
          'success': false,
          'message': 'Utilisateur non authentifié'
        };
      }
      
      final response = await http.post(
        Uri.parse('$baseUrl/sync/requests'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        }
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      } else {
        print('Erreur lors de la synchronisation: ${response.statusCode}');
        return {
          'success': false,
          'message': 'Erreur lors de la synchronisation: ${response.statusCode}'
        };
      }
    } catch (e) {
      print('Exception lors de la synchronisation: $e');
      return {
        'success': false,
        'message': 'Exception lors de la synchronisation: $e'
      };
    }
  }
  
  /// Récupère les demandes des deux applications (web et mobile) depuis la base de données aya_db
  /// Optimisé pour une liaison en temps réel entre les applications
  Future<List<Request>> fetchCrossPlatformRequests() async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        return [];
      }
      
      // Utiliser l'URL principale pour les demandes cross-platform avec la base aya_db
      final requestsEndpoint = ApiConfig.endpoints['requests']!;
      
      // Ajouter un paramètre timestamp pour éviter la mise en cache par le navigateur
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      
      List<Request> allRequests = [];
      
      // Récupérer toutes les demandes depuis l'endpoint standard /requests
      try {
        // Utiliser l'endpoint standard /requests pour récupérer toutes les demandes (web et mobile)
        final url = '${Constants.apiUrl}${ApiEndpoints.requests}?t=$timestamp&all=true';
        print('DIAGNOSTIC: Tentative de récupération de TOUTES les demandes depuis $url');
        
        final response = await http.get(
          Uri.parse(url),
          headers: {
            ...ApiConfig.getDefaultHeaders(token),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'User-Agent': 'Flutter/Mobile/Sync',
          },
        ).timeout(Duration(seconds: 30));
        
        print('DIAGNOSTIC: Réponse de l\'API cross-platform - Status: ${response.statusCode}');
        
        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          print('DIAGNOSTIC: Nombre de demandes récupérées depuis l\'API: ${data.length}');
          
          // Afficher les 2 premières demandes pour débogage
          if (data.isNotEmpty) {
            print('DIAGNOSTIC: Première demande: ${data[0]}');
            if (data.length > 1) {
              print('DIAGNOSTIC: Deuxième demande: ${data[1]}');
            }
          }
          
          // Analyser chaque demande pour détecter si elle provient du web ou du mobile
          print('DIAGNOSTIC: Analyse des sources des demandes...');
          int webCount = 0;
          int mobileCount = 0;
          int unknownCount = 0;
          
          // Traiter les données pour s'assurer que la source est correctement définie
          final processedData = data.map((item) {
            // Vérifier si la source est déjà définie
            if (!item.containsKey('source') || item['source'] == null || 
                (item['source'] != 'web' && item['source'] != 'mobile')) {
              
              // Déterminer la source en fonction des attributs de la demande
              bool isWeb = false;
              
              // 1. Vérifier l'ID selon les formats spécifiques
              if (item.containsKey('id')) {
                String id = item['id'].toString();
                if (id.startsWith('req-') || 
                    id.contains('-') || // Format UUID typique des applications web
                    id.length == 10 && !id.contains('_') ||
                    RegExp(r'^\d{10,13}$').hasMatch(id)) {
                  isWeb = true;
                }
              }
              
              // 2. Vérifier les attributs spécifiques
              if (item.containsKey('created_from') && item['created_from'] != null) {
                String createdFrom = item['created_from'].toString().toLowerCase();
                if (createdFrom == 'web' || createdFrom == 'admin' || createdFrom == 'dashboard') {
                  isWeb = true;
                } else if (createdFrom == 'mobile' || createdFrom == 'app') {
                  isWeb = false; // C'est explicitement mobile
                }
              }
              
              // 3. Vérifier les détails
              if (item.containsKey('details') && item['details'] != null) {
                var details = item['details'];
                // Si details est une chaîne JSON, essayer de la parser
                if (details is String) {
                  try {
                    details = jsonDecode(details);
                  } catch (e) {
                    // Ignorer l'erreur si ce n'est pas du JSON valide
                  }
                }
                
                if (details is Map) {
                  if (details.containsKey('source') && 
                      details['source'].toString().toLowerCase() == 'web') {
                    isWeb = true;
                  } else if (details.containsKey('source') && 
                      details['source'].toString().toLowerCase() == 'mobile') {
                    isWeb = false;
                  }
                  
                  if (details.containsKey('interface') && 
                      details['interface'].toString().toLowerCase() == 'web') {
                    isWeb = true;
                  } else if (details.containsKey('interface') && 
                      details['interface'].toString().toLowerCase() == 'mobile') {
                    isWeb = false;
                  }
                }
              }
              
              // 4. Vérifier la description
              if (item.containsKey('description') && item['description'] != null) {
                String desc = item['description'].toString();
                if ((desc.contains('jours') && RegExp(r'\d{4}-\d{2}-\d{2}').hasMatch(desc)) ||
                    desc.contains('web')) {
                  isWeb = true;
                }
              }
              
              // Définir la source en fonction de l'analyse
              item['source'] = isWeb ? 'web' : 'mobile';
              
              // Compter le type de demande
              if (isWeb) {
                webCount++;
              } else {
                mobileCount++;
              }
            } else {
              // Compter en fonction de la source déjà définie
              if (item['source'] == 'web') {
                webCount++;
              } else if (item['source'] == 'mobile') {
                mobileCount++;
              } else {
                unknownCount++;
              }
            }
            return item;
          }).toList();
          
          allRequests = processedData.map((item) => Request.fromJson(item)).toList();
          
          // Afficher le résumé des demandes par source
          print('DIAGNOSTIC: ${allRequests.length} demandes cross-platform récupérées avec succès');
          print('DIAGNOSTIC: Répartition des demandes - Web: $webCount, Mobile: $mobileCount, Inconnu: $unknownCount');
          
          // Afficher les 3 premières demandes de chaque type pour vérification
          print('\nDIAGNOSTIC: Exemples de demandes WEB:');
          int webShown = 0;
          for (var req in allRequests) {
            if (req.source == 'web' && webShown < 3) {
              print('  - ID: ${req.id}, Type: ${req.type}, Description: ${req.description}');
              webShown++;
            }
          }
          
          print('\nDIAGNOSTIC: Exemples de demandes MOBILE:');
          int mobileShown = 0;
          for (var req in allRequests) {
            if (req.source == 'mobile' && mobileShown < 3) {
              print('  - ID: ${req.id}, Type: ${req.type}, Description: ${req.description}');
              mobileShown++;
            }
          }
        } else {
          print('Endpoint cross-platform non disponible: ${response.statusCode}');
        }
      } catch (e) {
        print('Exception avec l\'endpoint cross-platform: $e');
      }
      
      // 2. Si aucune demande n'est récupérée, essayer l'endpoint standard
      if (allRequests.isEmpty) {
        try {
          final url = '$baseUrl$requestsEndpoint?t=$timestamp';
          
          final response = await http.get(
            Uri.parse(url),
            headers: ApiConfig.getDefaultHeaders(token),
          ).timeout(Duration(seconds: 10)); // Réduire le timeout pour une réponse plus rapide
          
          if (response.statusCode == 200) {
            final List<dynamic> data = jsonDecode(response.body);
            
            // Traiter les données pour s'assurer que la source est correctement définie
            final processedData = data.map((item) {
              // Vérifier si la source est déjà définie
              if (!item.containsKey('source') || item['source'] == null) {
                // Déterminer la source en fonction des attributs de la demande
                if (item.containsKey('created_from') && item['created_from'] != null) {
                  item['source'] = item['created_from'].toString().toLowerCase();
                } else if (item.containsKey('platform') && item['platform'] != null) {
                  item['source'] = item['platform'].toString().toLowerCase();
                } else if (item.containsKey('details') && item['details'] != null) {
                  final details = item['details'];
                  if (details is Map && details.containsKey('source')) {
                    item['source'] = details['source'].toString().toLowerCase();
                  } else if (details is Map && details.containsKey('platform')) {
                    item['source'] = details['platform'].toString().toLowerCase();
                  }
                }
              }
              return item;
            }).toList();
            
            allRequests = processedData.map((item) => Request.fromJson(item)).toList();
          }
        } catch (e) {
          // Gestion silencieuse des erreurs en production
        }
      }
      
      // 3. Si toujours aucune demande, essayer l'URL de secours
      if (allRequests.isEmpty) {
        try {
          // Utiliser l'URL de secours avec paramètre timestamp pour éviter la mise en cache
          final backupUrl = '$backupBaseUrl$requestsEndpoint?t=$timestamp';
          
          if (kDebugMode) {
            print('SYNCHRONISATION: Récupération des demandes depuis $backupUrl');
          }
          
          final response = await http.get(
            Uri.parse(backupUrl),
            headers: ApiConfig.getDefaultHeaders(token),
          ).timeout(Duration(seconds: 15));
          
          if (response.statusCode == 200) {
            final List<dynamic> data = jsonDecode(response.body);
            
            if (kDebugMode) {
              print('SYNCHRONISATION: ${data.length} demandes récupérées depuis l\'URL de secours');
            }
            
            // Traiter les données pour s'assurer que la source est correctement définie
            final processedData = data.map((item) {
              // Vérifier si la source est déjà définie
              if (!item.containsKey('source') || item['source'] == null) {
                // Déterminer la source en fonction des attributs de la demande
                if (item.containsKey('created_from') && item['created_from'] != null) {
                  item['source'] = item['created_from'].toString().toLowerCase();
                } else if (item.containsKey('platform') && item['platform'] != null) {
                  item['source'] = item['platform'].toString().toLowerCase();
                } else if (item.containsKey('details') && item['details'] != null) {
                  final details = item['details'];
                  if (details is Map && details.containsKey('source')) {
                    item['source'] = details['source'].toString().toLowerCase();
                  } else if (details is Map && details.containsKey('platform')) {
                    item['source'] = details['platform'].toString().toLowerCase();
                  }
                }
              }
              return item;
            }).toList();
            
            allRequests = processedData.map((item) => Request.fromJson(item)).toList();
          }
        } catch (e) {
          // Gestion silencieuse des erreurs en production
        }
      }
      
      // 4. Essayer de récupérer les demandes locales si aucune demande n'est récupérée
      if (allRequests.isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        final String? requestsJson = prefs.getString('shared_requests');
        
        if (requestsJson != null && requestsJson.isNotEmpty) {
          try {
            final List<dynamic> data = jsonDecode(requestsJson);
            allRequests = data.map((item) => Request.fromJson(item)).toList();
          } catch (e) {
            // Gestion silencieuse des erreurs en production
          }
        }
      }
      
      // En production, pas de statistiques affichées
      
      return allRequests;
    } catch (e) {
      return [];
    }
  }
  
  /// Récupère les statistiques des demandes par source
  Future<Map<String, dynamic>> getRequestStats() async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        return {
          'success': false,
          'message': 'Utilisateur non authentifié'
        };
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/sync/requests/stats'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        }
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      } else {
        print('Erreur lors de la récupération des statistiques: ${response.statusCode}');
        return {
          'success': false,
          'message': 'Erreur lors de la récupération des statistiques: ${response.statusCode}'
        };
      }
    } catch (e) {
      print('Exception lors de la récupération des statistiques: $e');
      return {
        'success': false,
        'message': 'Exception lors de la récupération des statistiques: $e'
      };
    }
  }
  
  /// Marque une demande comme provenant de l'application mobile
  Future<bool> markRequestAsMobile(String requestId) async {
    try {
      final token = await _authService.getToken();
      
      if (token == null) {
        return false;
      }
      
      final response = await http.put(
        Uri.parse('$baseUrl/requests/$requestId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: json.encode({
          'source': 'mobile'
        })
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Exception lors du marquage de la demande: $e');
      return false;
    }
  }
  
  /// Vérifie si une synchronisation est nécessaire
  Future<bool> isSyncNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSync = prefs.getString('lastSync');
    
    if (lastSync == null) {
      return true;
    }
    
    final lastSyncDate = DateTime.parse(lastSync);
    final now = DateTime.now();
    final difference = now.difference(lastSyncDate);
    
    // Synchroniser si la dernière synchronisation date de plus de 15 minutes
    return difference.inMinutes > 15;
  }
  
  /// Met à jour la date de dernière synchronisation
  Future<void> updateLastSync() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('lastSync', DateTime.now().toIso8601String());
  }
}
