import 'package:flutter/material.dart';
import '../models/request.dart';
import '../utils/date_formatter.dart';
import '../services/cross_platform_service.dart';

class RequestItem extends StatelessWidget {
  final Request request;
  final VoidCallback? onTap;
  final bool showSourceBadge;

  const RequestItem({
    Key? key,
    required this.request,
    this.onTap,
    this.showSourceBadge = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Déterminer la couleur en fonction du statut
    Color statusColor;
    switch (request.status.toLowerCase()) {
      case 'en attente':
        statusColor = Colors.orange;
        break;
      case 'approuvée':
      case 'approuvé':
      case 'acceptée':
      case 'accepté':
        statusColor = Colors.green;
        break;
      case 'refusée':
      case 'refusé':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.blue;
    }

    // Utiliser le service CrossPlatformService pour déterminer la source réelle
    final crossPlatformService = CrossPlatformService();
    final isWeb = crossPlatformService.isWebRequest(request);
    final isMobile = crossPlatformService.isMobileRequest(request) && !isWeb; // S'assurer que c'est exclusivement mobile
    
    // Déterminer la couleur en fonction de la source réelle
    Color sourceColor = isWeb ? Colors.blue : Colors.green;
    String sourceName = isWeb ? 'Web' : 'Mobile';

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: InkWell(
        onTap: onTap,
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
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor),
                    ),
                    child: Text(
                      request.status,
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
                    DateFormatter.formatDateRange(request.startDate, request.endDate),
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Description
              Text(
                request.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              // Source (Web ou Mobile)
              if (showSourceBadge)
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: sourceColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: sourceColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              request.source == 'web' ? Icons.computer : Icons.phone_android,
                              size: 14,
                              color: sourceColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              sourceName,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: sourceColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (request.createdAt != null) ...[  
                        const SizedBox(width: 8),
                        Text(
                          'Créée le ${DateFormatter.formatDate(request.createdAt!)}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
