import 'package:flutter/material.dart';

class SyncStatusWidget extends StatelessWidget {
  final VoidCallback? onRefresh;

  const SyncStatusWidget({Key? key, this.onRefresh}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Statut des données',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.blue),
                  onPressed: onRefresh,
                  tooltip: 'Actualiser les données',
                ),
              ],
            ),
            // Le message de statut a été supprimé comme demandé
          ],
        ),
      ),
    );
  }
}
