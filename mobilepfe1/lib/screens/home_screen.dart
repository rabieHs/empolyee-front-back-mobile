import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/request_provider.dart';
import '../providers/notification_provider.dart';
import '../providers/cross_platform_provider.dart';
import '../models/request.dart';
import '../utils/date_formatter.dart';
import 'login_screen.dart';
import 'request_detail_screen.dart';
import 'notification_screen.dart';
import 'profile_screen.dart';
import 'dashboard_screen.dart';
import 'requests/request_type_selection_screen.dart';
import 'cross_platform_requests_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    // Charger les demandes de l'utilisateur
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RequestProvider>(context, listen: false).fetchUserRequests();
      Provider.of<NotificationProvider>(context, listen: false)
          .fetchUserNotifications();
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final notificationProvider = Provider.of<NotificationProvider>(context);

    // Liste des écrans du bottom navigation bar
    final List<Widget> _widgetOptions = <Widget>[
      const DashboardScreen(), // Tableau de bord comme premier onglet
      _buildRequestsTab(),
      const RequestTypeSelectionScreen(), // Écran de sélection du type de demande
      const NotificationScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portail RH'),
        actions: [
          // Badge pour les notifications non lues
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () {
                  setState(() {
                    _selectedIndex =
                        3; // Aller à l'écran des notifications (index 3)
                  });
                },
              ),
              if (notificationProvider.unreadNotifications.isNotEmpty)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${notificationProvider.unreadNotifications.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          // Bouton de déconnexion
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              if (!mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: _widgetOptions.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: <BottomNavigationBarItem>[
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Tableau de bord',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.list),
            label: 'Demandes',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.add_circle),
            label: 'Créer',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible:
                  notificationProvider.unreadNotifications.isNotEmpty,
              label: Text('${notificationProvider.unreadNotifications.length}'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Notifications',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        onTap: _onItemTapped,
      ),
    );
  }

  Widget _buildRequestsTab() {
    final requestProvider = Provider.of<RequestProvider>(context);
    final crossPlatformProvider =
        Provider.of<CrossPlatformProvider>(context, listen: false);

    if (requestProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (requestProvider.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Erreur: ${requestProvider.error}',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                requestProvider.clearError();
                requestProvider.fetchUserRequests();
              },
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (requestProvider.requests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.inbox,
              size: 80,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            const Text(
              'Aucune demande trouvée',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _selectedIndex = 1; // Aller à l'écran de création de demande
                });
              },
              icon: const Icon(Icons.add),
              label: const Text('Créer une demande'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => requestProvider.fetchUserRequests(),
      child: Column(
        children: [
          // Bouton pour accéder à l'écran des demandes cross-platform
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Card(
              elevation: 2,
              child: InkWell(
                onTap: () {
                  // Charger les demandes cross-platform avant de naviguer
                  crossPlatformProvider.fetchAllSourceRequests();

                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const CrossPlatformRequestsScreen(),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.compare_arrows,
                            color: Colors.blue),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Toutes les demandes',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Voir les demandes des applications web et mobile',
                              style:
                                  TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Liste des demandes
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: requestProvider.requests.length,
              itemBuilder: (context, index) {
                final request = requestProvider.requests[index];
                return _buildRequestCard(request);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequestCard(Request request) {
    // Couleur selon le statut
    Color statusColor;
    switch (request.status.toLowerCase()) {
      case 'approuvée':
      case 'chef approuvé':
        statusColor = Colors.green;
        break;
      case 'refusée':
      case 'chef refusé':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.orange;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: InkWell(
        onTap: () {
          // Naviguer vers les détails de la demande
          final requestProvider =
              Provider.of<RequestProvider>(context, listen: false);
          requestProvider.selectRequest(request);
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => RequestDetailScreen(requestId: request.id),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Type de demande
                  Text(
                    request.type,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  // Statut
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor),
                    ),
                    child: Text(
                      request.statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Dates
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    DateFormatter.formatDateRange(
                        request.startDate, request.endDate),
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Durée
              Row(
                children: [
                  const Icon(Icons.timelapse, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${request.durationInDays} jour${request.durationInDays > 1 ? 's' : ''}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Description
              Text(
                request.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
