import 'package:flutter/material.dart';
import 'create_request_screen.dart';

class RequestTypeSelectionScreen extends StatelessWidget {
  const RequestTypeSelectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle Demande'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            const Text(
              'Sélectionnez le type de demande que vous souhaitez créer',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 24),
            
            // Grille de types de demandes
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 1.0,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildRequestTypeCard(
                  context,
                  'Congé',
                  Icons.event_available,
                  Colors.blue,
                  'Demandez des jours de congé pour vos vacances ou repos',
                ),
                _buildRequestTypeCard(
                  context,
                  'Formation',
                  Icons.school,
                  Colors.orange,
                  'Demandez une formation professionnelle',
                ),
                _buildRequestTypeCard(
                  context,
                  'Attestation de travail',
                  Icons.description,
                  Colors.green,
                  'Demandez une attestation de travail',
                ),
                _buildRequestTypeCard(
                  context,
                  'Demande de prêt',
                  Icons.account_balance,
                  Colors.purple,
                  'Faites une demande de prêt',
                ),
                _buildRequestTypeCard(
                  context,
                  'Demande d\'avance',
                  Icons.attach_money,
                  Colors.teal,
                  'Faites une demande d\'avance sur salaire',
                ),
                _buildRequestTypeCard(
                  context,
                  'Document administratif',
                  Icons.folder,
                  Colors.indigo,
                  'Demandez un document administratif',
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Bouton retour
            Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                icon: const Icon(Icons.arrow_back),
                label: const Text('Retour'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[600],
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestTypeCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    String description,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => CreateRequestScreen(requestType: title),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: color,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Text(
                  description,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
