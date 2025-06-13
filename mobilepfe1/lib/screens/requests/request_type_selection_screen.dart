import 'package:flutter/material.dart';
import 'leave_request_screen.dart';
import 'training_request_screen.dart';
import 'loan_request_screen.dart';
import 'advance_request_screen.dart';
import 'document_request_screen.dart';
import 'work_certificate_request_screen.dart';

class RequestTypeSelectionScreen extends StatelessWidget {
  const RequestTypeSelectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle demande'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sélectionnez le type de demande',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24.0),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  _buildRequestTypeCard(
                    context,
                    'Congé',
                    Icons.beach_access,
                    Colors.blue,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LeaveRequestScreen(),
                      ),
                    ),
                  ),
                  _buildRequestTypeCard(
                    context,
                    'Formation',
                    Icons.school,
                    Colors.orange,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TrainingRequestScreen(),
                      ),
                    ),
                  ),
                  _buildRequestTypeCard(
                    context,
                    'Prêt',
                    Icons.account_balance,
                    Colors.green,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LoanRequestScreen(),
                      ),
                    ),
                  ),
                  _buildRequestTypeCard(
                    context,
                    'Avance',
                    Icons.payments,
                    Colors.purple,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AdvanceRequestScreen(),
                      ),
                    ),
                  ),
                  _buildRequestTypeCard(
                    context,
                    'Document',
                    Icons.description,
                    Colors.teal,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const DocumentRequestScreen(),
                      ),
                    ),
                  ),
                  _buildRequestTypeCard(
                    context,
                    'Attestation',
                    Icons.work,
                    Colors.red,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const WorkCertificateRequestScreen(),
                      ),
                    ),
                  ),
                ],
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
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
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
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
