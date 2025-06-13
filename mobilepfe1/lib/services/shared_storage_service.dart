import 'dart:async';
import 'dart:math';
import 'package:intl/intl.dart';
import '../models/request.dart';

/// Service pour gérer les demandes en cache local
class SharedStorageService {
  static final StreamController<List<Request>> _requestsStreamController =
      StreamController<List<Request>>.broadcast();

  // Cache local des demandes
  List<Request> _cachedRequests = [];

  // Stream public pour écouter les changements de demandes
  Stream<List<Request>> get requestsStream => _requestsStreamController.stream;

  SharedStorageService() {
    print('SharedStorageService initialisé');
  }

  // Récupérer toutes les demandes depuis le cache local
  Future<List<Request>> getRequests() async {
    try {
      print(
          '${_cachedRequests.length} demandes récupérées depuis le cache local');
      return _cachedRequests;
    } catch (e) {
      print('Erreur getRequests: $e');
      return [];
    }
  }

  // Récupérer une demande par son ID depuis le cache local
  Future<Request?> getRequestById(String id) async {
    try {
      return _cachedRequests.firstWhere((req) => req.id == id);
    } catch (e) {
      print('Erreur getRequestById: $e');
      return null;
    }
  }

  // Ajouter une nouvelle demande au cache local
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

      _cachedRequests.add(newRequest);
      print('Demande ajoutée au cache local avec ID: $id');

      // Actualiser le stream
      _requestsStreamController.add(_cachedRequests);

      return newRequest;
    } catch (e) {
      print('Erreur addRequest: $e');
      rethrow;
    }
  }

  // Mettre à jour une demande dans le cache local
  Future<void> updateRequest(Request request) async {
    try {
      final index = _cachedRequests.indexWhere((req) => req.id == request.id);
      if (index != -1) {
        _cachedRequests[index] = request;
        print('Demande ${request.id} mise à jour dans le cache local');

        // Actualiser le stream
        _requestsStreamController.add(_cachedRequests);
      }
    } catch (e) {
      print('Erreur updateRequest: $e');
    }
  }

  // Mettre à jour plusieurs demandes (upsert)
  Future<void> updateRequests(List<Request> newRequests) async {
    try {
      _cachedRequests = newRequests;
      print('${newRequests.length} demandes mises à jour dans le cache local');

      _requestsStreamController.add(_cachedRequests);
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
