import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/request.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class RequestService {
  final AuthService _authService = AuthService();

  /// Récupérer toutes les demandes de l'utilisateur connecté
  Future<List<Request>> getUserRequests() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return [];
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/user');
      print('🔍 Récupération des demandes utilisateur: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getUserRequests: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ ${data.length} demandes récupérées');
        return data.map((json) => Request.fromJson(json)).toList();
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération des demandes: $e');
      return [];
    }
  }

  /// Récupérer toutes les demandes (pour admin/chef)
  Future<List<Request>> getAllRequests() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return [];
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/all');
      print('🔍 Récupération de toutes les demandes: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getAllRequests: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ ${data.length} demandes récupérées');
        return data.map((json) => Request.fromJson(json)).toList();
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération des demandes: $e');
      return [];
    }
  }

  /// Récupérer les demandes des subordonnés (pour chef)
  Future<List<Request>> getSubordinateRequests() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return [];
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/subordinates');
      print('🔍 Récupération des demandes des subordonnés: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getSubordinateRequests: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ ${data.length} demandes des subordonnés récupérées');
        return data.map((json) => Request.fromJson(json)).toList();
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print(
          '❌ Erreur lors de la récupération des demandes des subordonnés: $e');
      return [];
    }
  }

  /// Créer une nouvelle demande
  Future<Request?> createRequest({
    required String type,
    required String startDate,
    required String endDate,
    String? reason,
    Map<String, dynamic>? details,
  }) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests');
      print('➕ Création d\'une demande: $url');

      final requestData = {
        'type': type,
        'start_date': startDate,
        'end_date': endDate,
        if (reason != null)
          'description': reason, // Backend expects 'description'
        if (details != null) 'details': details,
      };

      final response = await http.post(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(requestData),
      );

      print('📡 Réponse createRequest: ${response.statusCode}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Demande créée avec succès');
        return Request.fromJson(data['request']);
      } else {
        print(
            '❌ Erreur lors de la création: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erreur lors de la création de la demande: $e');
      return null;
    }
  }

  /// Mettre à jour le statut d'une demande (pour chef/admin)
  Future<bool> updateRequestStatus(int requestId, String status,
      {String? comment}) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/$requestId/status');
      print('🔄 Mise à jour du statut de la demande: $url');

      final requestData = {
        'status': status,
        if (comment != null) 'comment': comment,
      };

      final response = await http.put(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(requestData),
      );

      print('📡 Réponse updateRequestStatus: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Statut de la demande mis à jour avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de la mise à jour: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du statut: $e');
      return false;
    }
  }

  /// Supprimer une demande
  Future<bool> deleteRequest(int requestId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/$requestId');
      print('🗑️ Suppression de la demande: $url');

      final response = await http.delete(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse deleteRequest: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Demande supprimée avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de la suppression: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de la suppression de la demande: $e');
      return false;
    }
  }

  /// Récupérer une demande par son ID
  Future<Request?> getRequestById(int requestId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/requests/$requestId');
      print('🔍 Récupération de la demande par ID: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getRequestById: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Demande récupérée avec succès');
        return Request.fromJson(data);
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération de la demande: $e');
      return null;
    }
  }

  /// Ajouter un commentaire à une demande
  Future<bool> addComment(int requestId, String comment) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url =
          Uri.parse('${ApiConfig.baseUrl}/requests/$requestId/comments');
      print('💬 Ajout d\'un commentaire: $url');

      final requestData = {
        'comment': comment,
      };

      final response = await http.post(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(requestData),
      );

      print('📡 Réponse addComment: ${response.statusCode}');

      if (response.statusCode == 201) {
        print('✅ Commentaire ajouté avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de l\'ajout du commentaire: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de l\'ajout du commentaire: $e');
      return false;
    }
  }

  /// Récupérer les commentaires d'une demande
  Future<List<Map<String, dynamic>>> getRequestComments(int requestId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return [];
      }

      final url =
          Uri.parse('${ApiConfig.baseUrl}/requests/$requestId/comments');
      print('💬 Récupération des commentaires: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getRequestComments: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ ${data.length} commentaires récupérés');
        return data.cast<Map<String, dynamic>>();
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération des commentaires: $e');
      return [];
    }
  }
}
