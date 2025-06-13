import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class UserService {
  final AuthService _authService = AuthService();

  /// Récupérer le profil de l'utilisateur connecté
  Future<User?> getUserProfile() async {
    try {
      final userId = await _authService.getUserId();
      final token = await _authService.getToken();

      if (userId == null || token == null) {
        print('❌ Aucun utilisateur connecté trouvé');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      print('🔍 Récupération du profil utilisateur: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getUserProfile: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Profil utilisateur récupéré avec succès');
        return User.fromJson(data);
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération du profil utilisateur: $e');
      return null;
    }
  }

  /// Mettre à jour le profil de l'utilisateur connecté
  Future<bool> updateUserProfile(Map<String, dynamic> userData) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/profile');
      print('🔄 Mise à jour du profil: $url');

      final response = await http.put(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(userData),
      );

      print('📡 Réponse updateUserProfile: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Profil mis à jour avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de la mise à jour: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du profil: $e');
      return false;
    }
  }

  /// Récupérer tous les utilisateurs (admin/chef seulement)
  Future<List<User>> getAllUsers() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return [];
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users');
      print('🔍 Récupération de tous les utilisateurs: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getAllUsers: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ ${data.length} utilisateurs récupérés');
        return data.map((json) => User.fromJson(json)).toList();
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération des utilisateurs: $e');
      return [];
    }
  }

  /// Récupérer un utilisateur par son ID
  Future<User?> getUserById(int userId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      print('🔍 Récupération utilisateur par ID: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse getUserById: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Utilisateur récupéré avec succès');
        return User.fromJson(data);
      } else {
        print('❌ Erreur serveur: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération de l\'utilisateur: $e');
      return null;
    }
  }

  /// Mettre à jour un utilisateur (admin seulement)
  Future<bool> updateUser(int userId, Map<String, dynamic> userData) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      print('🔄 Mise à jour utilisateur: $url');

      final response = await http.put(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(userData),
      );

      print('📡 Réponse updateUser: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Utilisateur mis à jour avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de la mise à jour: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour de l\'utilisateur: $e');
      return false;
    }
  }

  /// Supprimer un utilisateur (admin seulement)
  Future<bool> deleteUser(int userId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return false;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      print('🗑️ Suppression utilisateur: $url');

      final response = await http.delete(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
      );

      print('📡 Réponse deleteUser: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Utilisateur supprimé avec succès');
        return true;
      } else {
        print(
            '❌ Erreur lors de la suppression: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erreur lors de la suppression de l\'utilisateur: $e');
      return false;
    }
  }

  /// Créer un nouvel utilisateur complet (admin seulement)
  Future<User?> createCompleteUser(Map<String, dynamic> userData) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token non disponible');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}/users/complete');
      print('➕ Création utilisateur complet: $url');

      final response = await http.post(
        url,
        headers: ApiConfig.getDefaultHeaders(token),
        body: jsonEncode(userData),
      );

      print('📡 Réponse createCompleteUser: ${response.statusCode}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Utilisateur créé avec succès');
        return User.fromJson(data['user']);
      } else {
        print(
            '❌ Erreur lors de la création: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erreur lors de la création de l\'utilisateur: $e');
      return null;
    }
  }
}
