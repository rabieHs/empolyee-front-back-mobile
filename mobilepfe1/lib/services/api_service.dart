import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/api_config.dart';
import '../services/auth_service.dart';
import '../models/request.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();

  String get baseUrl => ApiConfig.baseUrl;
  final AuthService _authService = AuthService();

  factory ApiService() => _instance;
  ApiService._internal();

  // Récupérer toutes les demandes depuis la base (via API)
  Future<List<Request>> getAllRequests() async {
    try {
      final token = await _authService.getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/requests.php'),
        headers: ApiConfig.getDefaultHeaders(token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Request.fromJson(json)).toList();
      } else {
        print('Erreur récupération demandes: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Exception récupération demandes: $e');
      return [];
    }
  }

  // Ajouter une nouvelle demande (base)
  Future<bool> addRequest(Request request) async {
    try {
      final token = await _authService.getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/requests.php'),
        headers: ApiConfig.getDefaultHeaders(token),
        body: json.encode(request.toJson()),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Erreur ajout demande: $e');
      return false;
    }
  }

  // Mise à jour d'une demande existante
  Future<bool> updateRequest(Request request) async {
    try {
      final token = await _authService.getToken();
      final response = await http.put(
        Uri.parse('$baseUrl/update_request.php'),
        headers: ApiConfig.getDefaultHeaders(token),
        body: json.encode(request.toJson()),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Erreur update demande: $e');
      return false;
    }
  }

  // Mise à jour du statut d'une demande
  Future<bool> updateRequestStatus(String requestId, String newStatus) async {
    try {
      final token = await _authService.getToken();
      final response = await http.put(
        Uri.parse('$baseUrl/update_request_status.php'),
        headers: ApiConfig.getDefaultHeaders(token),
        body: json.encode({'id': requestId, 'status': newStatus}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Erreur update statut: $e');
      return false;
    }
  }

  // Télécharger une image de profil
  Future<String?> uploadProfileImage(File imageFile, int userId) async {
    try {
      final token = await _authService.getToken();
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload_profile_image.php'),
      );

      request.fields['user_id'] = userId.toString();
      request.headers['Authorization'] = 'Bearer $token';

      final extension = imageFile.path.split('.').last.toLowerCase();
      final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';

      request.files.add(await http.MultipartFile.fromPath(
        'profile_image',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      ));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['image_url'];
      } else {
        print('Erreur upload image: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Exception upload image: $e');
      return null;
    }
  }

  // Mise à jour des infos utilisateur
  Future<bool> updateUser(User user) async {
    try {
      final token = await _authService.getToken();
      final response = await http.put(
        Uri.parse('$baseUrl/users.php/${user.id}'),
        headers: ApiConfig.getDefaultHeaders(token),
        body: json.encode(user.toJson()),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Erreur update utilisateur: $e');
      return false;
    }
  }
}
