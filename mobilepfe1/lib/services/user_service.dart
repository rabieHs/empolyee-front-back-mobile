import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class UserService {
  final AuthService _authService = AuthService();

  // Méthode pour récupérer le profil de l'utilisateur connecté
  Future<User?> getUserProfile() async {
    try {
      // Récupérer l'ID de l'utilisateur connecté via AuthService
      final userId = await _authService.getUserId();

      if (userId == null) {
        print('Aucun utilisateur connecté trouvé');
        return null; // Ou gérer selon besoin
      }

      // TODO: Remplacer l'URL par ton endpoint API réel ou ta requête locale en base
      final url = Uri.parse('${Constants.apiUrl}/users/$userId');

      final response = await http.get(url, headers: {
        'Authorization': 'Bearer ${await _authService.getToken()}',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return User.fromJson(data);
      } else {
        print('Erreur serveur: statut ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Erreur lors de la récupération du profil utilisateur: $e');
      return null;
    }
  }
}
