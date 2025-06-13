import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class ProfileService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Récupère le profil utilisateur, ou null si absent
  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      // Lire token et infos utilisateur stockées localement
      final token = await _storage.read(key: 'auth_token');
      final userId = await _storage.read(key: 'user_id');

      if (token == null || userId == null) {
        print('Token ou userId absent, profil non disponible');
        return null;
      }

      // Appel API pour récupérer le profil réel
      final response = await http.get(
        Uri.parse('${Constants.apiUrl}/users/$userId/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Profil utilisateur récupéré depuis API');
        return data;
      } else {
        print(
            'Erreur API lors de la récupération du profil: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Exception lors de la récupération du profil: $e');
      return null;
    }
  }
}
