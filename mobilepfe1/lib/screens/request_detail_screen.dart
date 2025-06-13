import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/request_provider.dart';
import '../models/request.dart';

class RequestDetailScreen extends StatefulWidget {
  final String requestId;
  
  const RequestDetailScreen({
    Key? key,
    required this.requestId,
  }) : super(key: key);

  @override
  State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  Request? _request;
  bool _isLoading = true;
  bool _isDeleting = false;
  
  @override
  void initState() {
    super.initState();
    // Charger les détails de la demande si nécessaire
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final requestProvider = Provider.of<RequestProvider>(context, listen: false);
      if (requestProvider.selectedRequest == null || 
          requestProvider.selectedRequest!.id != widget.requestId) {
        requestProvider.fetchRequestDetails(widget.requestId);
      }
    });
  }
  
  /// Afficher une boîte de dialogue pour confirmer la suppression
  Future<void> _showDeleteConfirmation(String requestId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: const Text('Voulez-vous vraiment supprimer cette demande ? Cette action est irréversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    
    if (confirmed == true) {
      await _deleteRequest(requestId);
    }
  }

  /// Méthode pour supprimer une demande
  Future<void> _deleteRequest(String requestId) async {
    setState(() {
      _isDeleting = true;
    });
    
    try {
      final requestProvider = Provider.of<RequestProvider>(context, listen: false);
      final result = await requestProvider.deleteRequest(requestId);
      
      if (!mounted) return;
      
      if (result) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Demande supprimée avec succès')),
        );
        Navigator.of(context).pop(true); // Retourner true pour indiquer que la demande a été supprimée
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur lors de la suppression de la demande')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isDeleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final requestProvider = Provider.of<RequestProvider>(context);
    final request = requestProvider.selectedRequest;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails de la demande'),
        actions: [
          // Bouton de suppression pour les demandes en cours
          if (request != null && request.status.toLowerCase() == 'en attente')
            IconButton(
              icon: _isDeleting 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.delete),
              onPressed: _isDeleting 
                ? null 
                : () => _showDeleteConfirmation(request.id),
              tooltip: 'Supprimer la demande',
            ),
        ],
      ),
      body: requestProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : request == null
              ? const Center(child: Text('Demande non trouvée'))
              : _buildRequestDetails(request),
    );
  }
  
  Widget _buildRequestDetails(Request request) {
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
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête avec le type et le statut
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  request.type,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
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
          const SizedBox(height: 24),
          
          // Informations de base
          _buildInfoSection('Informations', [
            _buildInfoRow('ID', request.id),
            _buildInfoRow('Dates', request.formattedDate),
            _buildInfoRow('Durée', '${request.durationInDays} jour${request.durationInDays > 1 ? 's' : ''}'),
            if (request.createdAt != null)
              _buildInfoRow('Créée le', request.createdAt!),
            _buildInfoRow('Application', 'Application unifiée',
              icon: Icons.sync),
          ]),
          
          const SizedBox(height: 24),
          
          // Description
          _buildInfoSection('Description', [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Text(request.description),
            ),
          ]),
          
          const SizedBox(height: 24),
          
          // Détails supplémentaires
          if (request.details != null && request.details!.isNotEmpty)
            _buildInfoSection('Détails supplémentaires', 
              request.details!.entries.map((entry) => 
                _buildInfoRow(entry.key, entry.value.toString())
              ).toList(),
            ),
          
          const SizedBox(height: 24),
          
          // Bouton d'annulation pour les demandes en cours
          if (request.status.toLowerCase() == 'en attente')
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isDeleting ? null : () => _showDeleteConfirmation(request.id),
                  icon: const Icon(Icons.delete),
                  label: const Text('Supprimer cette demande'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildInfoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        const Divider(),
        ...children,
      ],
    );
  }
  
  Widget _buildInfoRow(String label, String value, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                if (icon != null) ...[  
                  Icon(icon, size: 16, color: Colors.blue),
                  const SizedBox(width: 8),
                ],
                Text(value),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  // Les méthodes liées aux commentaires ont été supprimées
}
