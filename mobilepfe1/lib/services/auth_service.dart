import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/app_constants.dart';
import '../config/api_config.dart';

class AuthService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Méthode pour se connecter avec le backend
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('🔐 Tentative de connexion: $email');
      final apiUrl = '${ApiConfig.baseUrl}/auth/login';
      print('🌐 URL API: $apiUrl');

      final response = await http
          .post(
            Uri.parse(apiUrl),
            headers: ApiConfig.getDefaultHeaders(null),
            body: jsonEncode({
              'email': email,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 30));

      print('📡 Réponse login: ${response.statusCode}');
      print('📄 Corps réponse: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Connexion réussie! Données: $data');

        // Extraire les informations utilisateur
        final user = data['user'];
        final token = data['token'];

        // Stocker le token et les informations utilisateur
        await _storage.write(key: AppConstants.tokenKey, value: token);
        await _storage.write(
            key: AppConstants.userIdKey, value: user['id'].toString());
        await _storage.write(
            key: AppConstants.userRoleKey, value: user['role']);
        await _storage.write(key: 'user_email', value: user['email']);
        await _storage.write(key: 'user_firstname', value: user['firstname']);
        await _storage.write(key: 'user_lastname', value: user['lastname']);

        return {
          'success': true,
          'message': data['message'],
          'token': token,
          'user': user,
        };
      } else {
        final errorData = jsonDecode(response.body);
        print(
            '❌ Erreur connexion: ${response.statusCode} - ${errorData['message']}');

        return {
          'success': false,
          'message': errorData['message'] ?? 'Identifiants invalides',
        };
      }
    } catch (error) {
      print('❌ Erreur réseau: $error');

      String errorMessage = 'Impossible de se connecter au serveur';

      if (error.toString().contains('SocketException')) {
        errorMessage =
            'Vérifiez votre connexion internet et que le serveur backend est démarré';
      } else if (error.toString().contains('timeout')) {
        errorMessage =
            'Délai d\'attente dépassé. Le serveur met trop de temps à répondre';
      }

      return {
        'success': false,
        'message': errorMessage,
        'error': error.toString(),
      };
    }
  }

  /// Méthode pour s'inscrire
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstname,
    required String lastname,
    String role = 'user',
    int? chefId,
  }) async {
    try {
      print('📝 Tentative d\'inscription: $email');
      final apiUrl = '${ApiConfig.baseUrl}/auth/register';
      print('🌐 URL API: $apiUrl');

      final response = await http
          .post(
            Uri.parse(apiUrl),
            headers: ApiConfig.getDefaultHeaders(null),
            body: jsonEncode({
              'email': email,
              'password': password,
              'firstname': firstname,
              'lastname': lastname,
              'role': role,
              if (chefId != null) 'chef_id': chefId,
            }),
          )
          .timeout(const Duration(seconds: 30));

      print('📡 Réponse register: ${response.statusCode}');
      print('📄 Corps réponse: ${response.body}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Inscription réussie!');

        // Extraire les informations utilisateur
        final user = data['user'];
        final token = data['token'];

        // Stocker le token et les informations utilisateur
        await _storage.write(key: AppConstants.tokenKey, value: token);
        await _storage.write(
            key: AppConstants.userIdKey, value: user['id'].toString());
        await _storage.write(
            key: AppConstants.userRoleKey, value: user['role']);
        await _storage.write(key: 'user_email', value: user['email']);
        await _storage.write(key: 'user_firstname', value: user['firstname']);
        await _storage.write(key: 'user_lastname', value: user['lastname']);

        return {
          'success': true,
          'message': data['message'],
          'token': token,
          'user': user,
        };
      } else {
        final errorData = jsonDecode(response.body);
        print(
            '❌ Erreur inscription: ${response.statusCode} - ${errorData['message']}');

        return {
          'success': false,
          'message': errorData['message'] ?? 'Erreur lors de l\'inscription',
        };
      }
    } catch (error) {
      print('❌ Erreur réseau inscription: $error');

      return {
        'success': false,
        'message': 'Impossible de se connecter au serveur',
        'error': error.toString(),
      };
    }
  }

  // Mode de secours pour permettre la connexion même sans serveur
  Future<Map<String, dynamic>> _useFallbackMode() async {
    print('Utilisation du mode de secours');

    // Stocker le token et les informations de l'utilisateur
    await _storage.write(key: AppConstants.tokenKey, value: 'demo_token');
    await _storage.write(key: AppConstants.userIdKey, value: '1');
    await _storage.write(key: AppConstants.userRoleKey, value: 'user');

    return {
      'success': true,
      'token': 'demo_token',
      'userId': 1,
      'role': 'user',
    };
  }

  // Méthode pour se déconnecter
  Future<void> logout() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.userIdKey);
    await _storage.delete(key: AppConstants.userRoleKey);
  }

  // Méthode pour vérifier si l'utilisateur est connecté
  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    return token != null;
  }

  // Méthode pour récupérer le token
  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  // Méthode pour récupérer l'ID de l'utilisateur
  Future<String?> getUserId() async {
    return await _storage.read(key: AppConstants.userIdKey);
  }

  // Méthode pour récupérer le rôle de l'utilisateur
  Future<String?> getUserRole() async {
    return await _storage.read(key: AppConstants.userRoleKey);
  }

  /// Méthode pour récupérer le profil de l'utilisateur
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final userId = await getUserId();
      if (userId == null) {
        throw Exception('Utilisateur non connecté');
      }

      // Retourner les informations de base de l'utilisateur
      return {
        'id': userId,
        'email':
            await _storage.read(key: 'user_email') ?? 'utilisateur@example.com',
        'firstname':
            await _storage.read(key: 'user_firstname') ?? 'Utilisateur',
        'lastname': await _storage.read(key: 'user_lastname') ?? '',
        'role': await getUserRole() ?? 'user',
      };
    } catch (e) {
      print('Erreur lors de la récupération du profil: $e');
      // Retourner un profil par défaut en cas d'erreur
      return {
        'id': '1',
        'email': 'utilisateur@example.com',
        'firstname': 'Utilisateur',
        'lastname': '',
        'role': 'user',
        'isDefaultProfile': true,
      };
    }
  }
}
