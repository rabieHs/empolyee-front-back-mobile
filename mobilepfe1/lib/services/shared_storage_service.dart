import 'dart:async';
import 'dart:math';
import 'package:intl/intl.dart';
import '../models/request.dart';
import 'database_service.dart';

/// Service pour gérer les demandes en lien direct avec la base locale aya_db
/// Supprime l'usage de SharedPreferences au profit de DatabaseService
class SharedStorageService {
  static final StreamController<List<Request>> _requestsStreamController =
      StreamController<List<Request>>.broadcast();

  final DatabaseService _databaseService = DatabaseService();

  // Stream public pour écouter les changements de demandes en base locale
  Stream<List<Request>> get requestsStream => _requestsStreamController.stream;

  SharedStorageService() {
    print('SharedStorageService initialisé');
    // Charger les demandes dès l'initialisation
    _loadRequestsFromDatabase();
  }

  // Charge les demandes depuis la base locale et notifie les listeners
  Future<void> _loadRequestsFromDatabase() async {
    try {
      final requests = await _databaseService.getAllRequests();
      _requestsStreamController.add(requests);
      print('${requests.length} demandes chargées depuis la base locale');
    } catch (e) {
      print('Erreur lors du chargement des demandes depuis la base locale: $e');
      _requestsStreamController.add([]);
    }
  }

  // Récupérer toutes les demandes depuis la base locale
  Future<List<Request>> getRequests() async {
    try {
      final requests = await _databaseService.getAllRequests();
      return requests;
    } catch (e) {
      print('Erreur getRequests: $e');
      return [];
    }
  }

  // Récupérer une demande par son ID depuis la base locale
  Future<Request?> getRequestById(String id) async {
    try {
      return await _databaseService.getRequestById(id);
    } catch (e) {
      print('Erreur getRequestById: $e');
      return null;
    }
  }

  // Ajouter une nouvelle demande : insertion dans la base locale
  Future<Request> addRequest({
    required String type,
    required String startDate,
    required String endDate,
    required String description,
    Map<String, dynamic>? details,
    int? userId,
  }) async {
    try {
      // Générer un ID unique
      final id = _generateRandomString(9);

      final newRequest = Request(
        id: id,
        userId: userId ?? 1,
        type: type,
        status: 'En attente',
        startDate: startDate,
        endDate: endDate,
        description: description,
        details: details ??
            {
              'traitePar': 'Non traité',
              'reponse': 'Pas de réponse',
            },
        createdAt: DateFormat('dd/MM/yyyy').format(DateTime.now()),
      );

      await _databaseService.addRequest(newRequest);
      print('Demande ajoutée dans la base locale avec ID: $id');

      // Actualiser le stream
      final requests = await _databaseService.getAllRequests();
      _requestsStreamController.add(requests);

      return newRequest;
    } catch (e) {
      print('Erreur addRequest: $e');
      rethrow;
    }
  }

  // Mettre à jour une demande dans la base locale
  Future<void> updateRequest(Request request) async {
    try {
      await _databaseService.updateRequest(request);
      print('Demande ${request.id} mise à jour dans la base locale');

      // Actualiser le stream
      final requests = await _databaseService.getAllRequests();
      _requestsStreamController.add(requests);
    } catch (e) {
      print('Erreur updateRequest: $e');
    }
  }

  // Supprimer une demande dans la base locale (seulement si statut = "En attente")
  Future<bool> deleteRequest(String requestId) async {
    try {
      final request = await _databaseService.getRequestById(requestId);

      if (request == null) {
        print('Demande $requestId introuvable en base locale');
        return false;
      }

      if (request.status.toLowerCase() != 'en attente') {
        print(
            'Demande $requestId ne peut pas être supprimée car son statut est ${request.status}');
        return false;
      }

      await _databaseService.deleteRequest(requestId);
      print('Demande $requestId supprimée de la base locale');

      // Actualiser le stream
      final requests = await _databaseService.getAllRequests();
      _requestsStreamController.add(requests);

      return true;
    } catch (e) {
      print('Erreur deleteRequest: $e');
      return false;
    }
  }

  // Mettre à jour plusieurs demandes (upsert)
  Future<void> updateRequests(List<Request> newRequests) async {
    try {
      for (var req in newRequests) {
        await _databaseService.updateRequest(req);
      }
      print('${newRequests.length} demandes mises à jour en base locale');

      final requests = await _databaseService.getAllRequests();
      _requestsStreamController.add(requests);
    } catch (e) {
      print('Erreur updateRequests: $e');
    }
  }

  // Générer un ID aléatoire
  String _generateRandomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    return String.fromCharCodes(
      List.generate(
          length, (index) => chars.codeUnitAt(random.nextInt(chars.length))),
    );
  }

  void dispose() {
    _requestsStreamController.close();
  }
}
