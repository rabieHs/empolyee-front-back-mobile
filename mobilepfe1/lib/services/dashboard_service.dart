import 'dart:async';
import '../models/request.dart';
import 'shared_storage_service.dart';
import 'request_service.dart';

// Structure pour stocker les statistiques du tableau de bord
class DashboardStats {
  final int enAttente;
  final int approuvees;
  final int refusees;
  final int total;
  final List<Request> recentRequests;

  DashboardStats({
    required this.enAttente,
    required this.approuvees,
    required this.refusees,
    required this.total,
    required this.recentRequests,
  });
}

class DashboardService {
  final SharedStorageService _sharedStorage = SharedStorageService();
  final RequestService _requestService = RequestService();

  // StreamController broadcast pour notifier les mises à jour des stats
  final _dashboardStatsController =
      StreamController<DashboardStats>.broadcast();

  // Stream public pour écouter les statistiques
  Stream<DashboardStats> get dashboardStatsStream =>
      _dashboardStatsController.stream;

  // Abonnement aux changements dans les demandes stockées localement
  StreamSubscription<List<Request>>? _requestsSubscription;

  DashboardService() {
    // Écoute des changements dans le stockage local
    _requestsSubscription = _sharedStorage.requestsStream.listen((requests) {
      final stats = _calculateStats(requests);
      _dashboardStatsController.add(stats);
    });
  }

  void dispose() {
    _requestsSubscription?.cancel();
    _dashboardStatsController.close();
  }

  // Charger les données locales et envoyer les stats
  Future<void> loadLocalData() async {
    try {
      print('[DashboardService] Chargement des données locales...');
      final requests = await _sharedStorage.getRequests();
      final stats = _calculateStats(requests);
      _dashboardStatsController.add(stats);
      print('[DashboardService] Données locales chargées avec succès');
    } catch (e) {
      print('[DashboardService] Erreur chargement données locales: $e');
      rethrow;
    }
  }

  // Récupérer les statistiques, prioritairement depuis l'API, fallback sur local
  Future<DashboardStats> getDashboardStats() async {
    try {
      final requests = await _requestService.getUserRequests();
      return _calculateStats(requests);
    } catch (e) {
      print('[DashboardService] Erreur récupération stats API: $e');
      try {
        final requests = await _sharedStorage.getRequests();
        return _calculateStats(requests);
      } catch (e) {
        print('[DashboardService] Erreur récupération stats local: $e');
        return DashboardStats(
          enAttente: 0,
          approuvees: 0,
          refusees: 0,
          total: 0,
          recentRequests: [],
        );
      }
    }
  }

  // Calculer les stats à partir d'une liste de demandes
  DashboardStats _calculateStats(List<Request> requests) {
    int enAttente = 0;
    int approuvees = 0;
    int refusees = 0;

    print(
        '[DashboardService] Calcul des statistiques pour ${requests.length} demandes');

    for (var r in requests) {
      final status = r.status.toLowerCase();
      print(' - Demande ${r.id} : status="${r.status}"');

      if (status.contains('attente')) {
        enAttente++;
      } else if (status.contains('approuv')) {
        approuvees++;
      } else if (status.contains('refus') || status.contains('rejet')) {
        refusees++;
      }
    }

    print(
        '[DashboardService] Stats calculées: enAttente=$enAttente, approuvees=$approuvees, refusees=$refusees, total=${requests.length}');

    // Trier par date (descendant)
    requests.sort((a, b) {
      DateTime parseDate(String? dateStr) {
        if (dateStr == null) return DateTime(1970);
        try {
          if (dateStr.contains('/')) {
            // Format dd/MM/yyyy
            final parts = dateStr.split('/');
            if (parts.length == 3) {
              return DateTime(
                int.parse(parts[2]),
                int.parse(parts[1]),
                int.parse(parts[0]),
              );
            }
          }
          return DateTime.parse(dateStr);
        } catch (_) {
          return DateTime(1970);
        }
      }

      final dateA = parseDate(a.createdAt);
      final dateB = parseDate(b.createdAt);
      return dateB.compareTo(dateA);
    });

    final recent = requests.take(5).toList();

    return DashboardStats(
      enAttente: enAttente,
      approuvees: approuvees,
      refusees: refusees,
      total: requests.length,
      recentRequests: recent,
    );
  }

  // Charger les données depuis l'API et notifier les listeners
  Future<void> loadDataFromApi() async {
    try {
      final requests = await _requestService.getUserRequests();
      print(
          '[DashboardService] Données API chargées: ${requests.length} demandes');
      final stats = _calculateStats(requests);
      _dashboardStatsController.add(stats);
    } catch (e) {
      print('[DashboardService] Erreur chargement données API: $e');
      await loadLocalData();
    }
  }
}
