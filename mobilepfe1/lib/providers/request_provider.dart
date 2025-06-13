import 'package:flutter/foundation.dart';
import '../models/request.dart';
import '../services/request_service.dart';

class RequestProvider with ChangeNotifier {
  final RequestService _requestService = RequestService();

  List<Request> _requests = [];
  Request? _selectedRequest;
  bool _isLoading = false;
  String? _error;

  RequestProvider() {
    fetchUserRequests(); // Charger directement au démarrage
  }

  @override
  void dispose() {
    super.dispose();
  }

  List<Request> get requests => _requests;
  Request? get selectedRequest => _selectedRequest;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Charger toutes les demandes depuis l'API directement
  Future<void> fetchUserRequests() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('Chargement des demandes depuis l\'API...');
      final fetchedRequests = await _requestService.fetchRequests();
      if (fetchedRequests != null && fetchedRequests.isNotEmpty) {
        _requests = fetchedRequests;
        print('${fetchedRequests.length} demandes chargées depuis l\'API');
      } else {
        _requests = [];
        print('Aucune demande trouvée depuis l\'API');
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Créer une nouvelle demande via l'API
  Future<bool> createRequest({
    required String type,
    required String startDate,
    required String endDate,
    required String description,
    Map<String, dynamic>? details,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newRequest = await _requestService.createRequest(
        type: type,
        startDate: startDate,
        endDate: endDate,
        description: description,
        details: details,
      );
      if (newRequest != null) {
        _requests.add(newRequest);
        notifyListeners();
        _isLoading = false;
        return true;
      } else {
        throw Exception('Erreur création demande');
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Détails d'une demande depuis l'API
  Future<void> fetchRequestDetails(String requestId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedRequest = await _requestService.getRequestDetails(requestId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Supprimer une demande via l'API
  Future<bool> deleteRequest(String requestId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final request = _requests.firstWhere(
        (req) => req.id == requestId,
        orElse: () => throw Exception('Demande non trouvée'),
      );

      if (request.status.toLowerCase() != 'en attente') {
        throw Exception(
            'Seules les demandes en attente peuvent être supprimées');
      }

      final success = await _requestService.deleteRequest(requestId);
      if (success) {
        _requests.removeWhere((req) => req.id == requestId);
        notifyListeners();
        _isLoading = false;
        return true;
      } else {
        throw Exception('Erreur suppression demande');
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void selectRequest(Request request) {
    _selectedRequest = request;
    notifyListeners();
  }

  void clearSelectedRequest() {
    _selectedRequest = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
