import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cross_platform_provider.dart';
import '../models/request.dart';
import '../widgets/request_item.dart';

class CrossPlatformRequestsScreen extends StatefulWidget {
  const CrossPlatformRequestsScreen({Key? key}) : super(key: key);

  @override
  State<CrossPlatformRequestsScreen> createState() => _CrossPlatformRequestsScreenState();
}

class _CrossPlatformRequestsScreenState extends State<CrossPlatformRequestsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isInit = true;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      _fetchData();
      _isInit = false;
    }
  }
  
  Future<void> _fetchData() async {
    // Utiliser la méthode de rafraîchissement en temps réel via WebSocket
    await Provider.of<CrossPlatformProvider>(context, listen: false).refreshRequestsRealtime();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Toutes les demandes (aya_db)'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'Web'),
            Tab(text: 'Mobile'),
          ],
        ),
        actions: [
          Consumer<CrossPlatformProvider>(builder: (ctx, provider, _) {
            return provider.isLoading
              ? const Padding(
                  padding: EdgeInsets.all(10.0),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                )
              : IconButton(
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Rafraîchir les demandes',
                  onPressed: () => _fetchData(),
                );
          }),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        child: Consumer<CrossPlatformProvider>(
          builder: (ctx, provider, child) {
            if (provider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            
            if (provider.error != null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 60, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'Erreur: ${provider.error}',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _fetchData,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            }
            
            return TabBarView(
              controller: _tabController,
              children: [
                _buildRequestsList(provider.allRequests),
                _buildRequestsList(provider.webRequests),
                _buildRequestsList(provider.mobileRequests),
              ],
            );
          },
        ),
      ),
    );
  }
  
  Widget _buildRequestsList(List<Request> requests) {
    if (requests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Aucune demande trouvée',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Tirez vers le bas pour rafraîchir',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchData,
              icon: const Icon(Icons.refresh),
              label: const Text('Rafraîchir'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: requests.length,
      itemBuilder: (ctx, index) {
        final request = requests[index];
        return RequestItem(
          request: request,
          onTap: () {
            Navigator.of(context).pushNamed(
              '/request-detail',
              arguments: request.id,
            );
          },
          showSourceBadge: true,
        );
      },
    );
  }
  
  // Les méthodes auxiliaires ont été déplacées dans le widget RequestItem
}
