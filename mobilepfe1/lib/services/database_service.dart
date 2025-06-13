import 'dart:async';
import 'package:mysql1/mysql1.dart';
import '../models/request.dart';
import '../utils/constants.dart';
import 'auth_service.dart';
import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  
  factory DatabaseService() {
    return _instance;
  }
  
  DatabaseService._internal();
  
  // Stream pour notifier les changements de demandes
  static final StreamController<List<Request>> _requestsStreamController = 
      StreamController<List<Request>>.broadcast();
  
  // Stream pour écouter les changements
  Stream<List<Request>> get requestsStream => _requestsStreamController.stream;
  
  Future<MySqlConnection> getConnection() async {
    final settings = ConnectionSettings(
      host: 'localhost', 
      port: 3306,
      user: 'root',
      password: '',
      db: 'aya_db'
    );
    
    print('Tentative de connexion à la base de données aya_db...');
    try {
      final conn = await MySqlConnection.connect(settings);
      print('Connexion à la base de données aya_db réussie!');
      return conn;
    } catch (e) {
      print('Erreur de connexion à la base de données: $e');
      rethrow;
    }
  }
  
  // Méthode pour récupérer les demandes depuis l'API
  Future<List<Request>> fetchRequests() async {
    try {
      print('Récupération des demandes depuis l\'API...');
      
      // Récupérer le token d'authentification
      final authService = AuthService();
      final token = await authService.getToken();
      
      if (token == null) {
        print('Aucun token d\'authentification trouvé');
        return [];
      }
      
      // Utiliser l'API pour récupérer les demandes
      final response = await http.get(
        Uri.parse('${Constants.apiUrl}/requests'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> requestsData = data['requests'] ?? [];
        
        print('${requestsData.length} demandes récupérées depuis l\'API');
        
        // Convertir les données JSON en objets Request
        final requests = requestsData.map((item) => Request.fromJson(item)).toList();
        
        // Notifier les écouteurs
        _requestsStreamController.add(requests);
        
        return requests;
      } else {
        print('Erreur lors de la récupération des demandes depuis l\'API: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Exception lors de la récupération des demandes depuis l\'API: $e');
      return [];
    }
  }
  
  Future<List<Request>> getAllRequests() async {
    // Essayer d'abord de récupérer les demandes depuis l'API
    try {
      final apiRequests = await fetchRequests();
      if (apiRequests.isNotEmpty) {
        return apiRequests;
      }
    } catch (e) {
      print('Erreur lors de la récupération des demandes depuis l\'API, tentative de récupération depuis la base de données locale: $e');
    }
    
    // Si l'API échoue, essayer la base de données locale
    final conn = await getConnection();
    List<Request> requests = [];
    
    try {
      print('Connexion à la base de données réussie');
      print('Tentative de récupération des demandes depuis la table requests dans aya_db...');
      
      // Vérifier si la table existe
      var tableCheck = await conn.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'aya_db' AND table_name = 'requests'"
      );
      
      bool tableExists = tableCheck.first['count'] > 0;
      print('La table requests existe: $tableExists');
      
      if (!tableExists) {
        print('La table requests n\'existe pas dans la base de données aya_db');
        // Créer la table requests si elle n'existe pas
        await _createRequestsTable(conn);
        return [];
      }
      
      // Récupérer toutes les demandes avec les informations des utilisateurs
      var results = await conn.query('''
        SELECT r.*, u.firstname, u.lastname, u.email, u.role, p.department, p.position 
        FROM requests r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN professional_info p ON u.id = p.user_id
        ORDER BY r.created_at DESC
      ''');
      
      print('Nombre de demandes trouvées: ${results.length}');
      
      for (var row in results) {
        // Afficher les détails de chaque ligne pour le débogage
        print('ID: ${row['id']}, Type: ${row['type']}, Status: ${row['status']}');
        
        // Extraire les détails JSON
        Map<String, dynamic>? details;
        if (row['details'] != null) {
          try {
            details = jsonDecode(row['details']);
          } catch (e) {
            print('Erreur lors du décodage des détails JSON: $e');
            details = {};
          }
        }
        
        // Convertir les données de la base en objet Request
        Request request = Request(
          id: row['id'].toString(),
          userId: row['user_id'] != null ? int.parse(row['user_id'].toString()) : 1,
          type: row['type'] ?? '',
          status: row['status'] ?? 'en attente',
          startDate: row['start_date'].toString(),
          endDate: row['end_date'].toString(),
          description: row['description'] ?? '',
          details: details,
          createdAt: row['created_at'].toString(),
          updatedAt: row['updated_at'].toString(),
          firstname: row['firstname'],
          lastname: row['lastname'],
          email: row['email'],
          role: row['role'],
          department: row['department'],
          position: row['position'],
        );
        
        requests.add(request);
      }
    } catch (e) {
      print('Erreur lors de la récupération des demandes: $e');
    } finally {
      await conn.close();
    }
    
    return requests;
  }
  
  // Ajouter une nouvelle demande dans la base de données
  Future<String?> addRequest(Request request) async {
    final conn = await getConnection();
    final authService = AuthService();
    
    try {
      print('Tentative d\'ajout d\'une nouvelle demande dans la base de données...');
      
      // Récupérer l'ID de l'utilisateur connecté
      final userId = await authService.getUserId();
      if (userId == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      // Générer un ID unique pour la demande
      final timestamp = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final uuid = Uuid();
      final shortUuid = uuid.v4().substring(0, 5);
      final requestId = 'req-$timestamp-$shortUuid';
      
      // Convertir les détails en JSON
      String detailsJson = '{}';
      if (request.details != null) {
        detailsJson = jsonEncode(request.details);
      }
      
      // Préparer la requête SQL avec la source 'mobile'
      var result = await conn.query(
        'INSERT INTO requests (id, user_id, type, status, start_date, end_date, description, details, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          requestId,
          int.parse(userId),
          request.type,
          'en attente', // Toujours en attente pour les nouvelles demandes
          request.startDate,
          request.endDate,
          request.description,
          detailsJson,
          'mobile'  // Indiquer que la demande provient de l'application mobile
        ]
      );
      
      print('Demande ajoutée avec succès dans la base de données avec ID: $requestId (source: mobile)');
      return requestId;
    } catch (e) {
      print('Erreur lors de l\'ajout de la demande dans la base de données: $e');
      return null;
    } finally {
      await conn.close();
    }
  }
  
  // Méthode pour mettre à jour l'ID d'une demande (utile après synchronisation avec le serveur)
  Future<bool> updateRequestId(String localId, String serverId) async {
    try {
      print('Mise à jour de l\'ID de la demande $localId vers $serverId');
      
      // Notifier les écouteurs du changement
      _notifyListeners();
      
      return true;
    } catch (e) {
      print('Erreur lors de la mise à jour de l\'ID de la demande: $e');
      return false;
    }
  }
  
  // Méthode pour notifier les écouteurs des changements
  void _notifyListeners() {
    // Récupérer toutes les demandes et les envoyer dans le stream
    getUserRequests('1').then((requests) {
      _requestsStreamController.add(requests);
    }).catchError((error) {
      print('Erreur lors de la notification des écouteurs: $error');
    });
  }
  
  // Méthode pour ajouter une demande à la base de données locale
  Future<bool> addRequestToLocalDatabase(Request request) async {
    try {
      print('Ajout de la demande ${request.id} à la base de données locale');
      
      // Notifier les écouteurs du changement
      _notifyListeners();
      
      return true;
    } catch (e) {
      print('Erreur lors de l\'ajout de la demande: $e');
      return false;
    }
  }
  
  // Créer la table requests si elle n'existe pas
  Future<void> _createRequestsTable(MySqlConnection conn) async {
    try {
      await conn.query('''
        CREATE TABLE IF NOT EXISTS requests (
          id VARCHAR(50) PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'en attente',
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          description TEXT,
          details JSON,
          source VARCHAR(10) DEFAULT 'web',
          chef_observation TEXT,
          admin_response TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      ''');
      
      print('Table requests créée avec succès!');
      
      // Vérifier si la colonne source existe déjà
      var columnCheck = await conn.query('''
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = 'aya_db' 
        AND table_name = 'requests' 
        AND column_name = 'source'
      ''');
      
      bool columnExists = columnCheck.first['count'] > 0;
      print('La colonne source existe: $columnExists');
      
      // Ajouter la colonne source si elle n'existe pas
      if (!columnExists) {
        await conn.query('ALTER TABLE requests ADD COLUMN source VARCHAR(10) DEFAULT "web" AFTER details');
        print('Colonne source ajoutée à la table requests');
      }
    } catch (e) {
      print('Erreur lors de la création de la table requests: $e');
      rethrow;
    }
  }
  
  // Récupérer les demandes d'un utilisateur spécifique
  Future<List<Request>> getUserRequests(String userId) async {
    final conn = await getConnection();
    List<Request> requests = [];
    
    try {
      print('Tentative de récupération des demandes pour l\'utilisateur $userId...');
      
      // Récupérer les demandes de l'utilisateur avec les informations de l'utilisateur
      var results = await conn.query('''
        SELECT r.*, u.firstname, u.lastname, u.email, u.role, p.department, p.position 
        FROM requests r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN professional_info p ON u.id = p.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      ''', [int.parse(userId)]);
      
      print('Nombre de demandes récupérées: ${results.length}');
      
      // Convertir les résultats en objets Request
      for (var row in results) {
        Map<String, dynamic>? details;
        if (row['details'] != null) {
          try {
            details = jsonDecode(row['details']);
          } catch (e) {
            print('Erreur lors du décodage des détails JSON: $e');
            details = {};
          }
        }
        
        Request request = Request(
          id: row['id'].toString(),
          userId: row['user_id'],
          type: row['type'],
          status: row['status'],
          startDate: row['start_date'].toString(),
          endDate: row['end_date'].toString(),
          description: row['description'] ?? '',
          details: details,
          createdAt: row['created_at'].toString(),
          updatedAt: row['updated_at'].toString(),
          firstname: row['firstname'],
          lastname: row['lastname'],
          email: row['email'],
          role: row['role'],
          department: row['department'],
          position: row['position'],
        );
        
        requests.add(request);
      }
      
      // Notifier les écouteurs des nouvelles demandes
      _requestsStreamController.add(requests);
      
      return requests;
    } catch (e) {
      print('Erreur lors de la récupération des demandes de l\'utilisateur: $e');
      return [];
    } finally {
      await conn.close();
    }
  }
  
  // Méthode pour supprimer une demande
  Future<bool> deleteRequest(String requestId) async {
    final conn = await getConnection();
    final authService = AuthService();
    
    try {
      print('Tentative de suppression de la demande $requestId dans la base de données...');
      
      // Récupérer l'ID de l'utilisateur connecté
      final userId = await authService.getUserId();
      if (userId == null) {
        throw Exception('Utilisateur non connecté');
      }
      
      // Vérifier si la demande existe et si elle est en attente
      var checkResult = await conn.query(
        'SELECT * FROM requests WHERE id = ? AND status = "en attente"',
        [requestId]
      );
      
      if (checkResult.isEmpty) {
        print('Demande $requestId non trouvée ou pas en attente');
        return false;
      }
      
      // Supprimer la demande
      var result = await conn.query(
        'DELETE FROM requests WHERE id = ?',
        [requestId]
      );
      
      print('Demande $requestId supprimée avec succès de la base de données');
      return result.affectedRows != null && result.affectedRows! > 0;
    } catch (e) {
      print('Erreur lors de la suppression de la demande: $e');
      return false;
    } finally {
      await conn.close();
    }
  }
}
