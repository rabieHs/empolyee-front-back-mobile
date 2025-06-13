import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/notification_provider.dart';
import '../models/notification.dart' as app_notification;

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({Key? key}) : super(key: key);

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    // Charger les notifications
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchUserNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationProvider = Provider.of<NotificationProvider>(context);
    
    return Scaffold(
      body: Column(
        children: [
          // En-tête avec le titre et le bouton "Tout marquer comme lu"
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Notifications',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (notificationProvider.unreadNotifications.isNotEmpty)
                  TextButton.icon(
                    onPressed: () async {
                      await notificationProvider.markAllAsRead();
                    },
                    icon: const Icon(Icons.done_all),
                    label: const Text('Tout marquer comme lu'),
                  ),
              ],
            ),
          ),
          
          // Liste des notifications
          Expanded(
            child: notificationProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : notificationProvider.error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Erreur: ${notificationProvider.error}',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                // Effacer l'erreur et recharger les notifications
                                notificationProvider.clearError();
                                notificationProvider.fetchUserNotifications();
                              },
                              child: const Text('Réessayer'),
                            ),
                          ],
                        ),
                      )
                    : notificationProvider.notifications.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.notifications_off,
                                  size: 80,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'Aucune notification',
                                  style: TextStyle(
                                    fontSize: 18,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => notificationProvider.fetchUserNotifications(),
                            child: ListView.builder(
                              itemCount: notificationProvider.notifications.length,
                              itemBuilder: (context, index) {
                                final notification = notificationProvider.notifications[index];
                                return _buildNotificationItem(notification);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildNotificationItem(app_notification.Notification notification) {
    final DateTime date = notification.date;
    final String formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);
    
    return Dismissible(
      key: Key(notification.id.toString()),
      background: Container(
        color: Colors.blue,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        child: const Icon(Icons.done, color: Colors.white),
      ),
      secondaryBackground: Container(
        color: Colors.blue,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.done, color: Colors.white),
      ),
      onDismissed: (direction) {
        Provider.of<NotificationProvider>(context, listen: false)
            .markAsRead(notification.id);
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        elevation: notification.isRead ? 1 : 3,
        color: notification.isRead ? null : Colors.blue.shade50,
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: notification.isRead ? Colors.grey : Colors.blue,
            child: const Icon(
              Icons.notifications,
              color: Colors.white,
            ),
          ),
          title: Text(
            notification.title,
            style: TextStyle(
              fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(notification.message),
              const SizedBox(height: 4),
              Text(
                formattedDate,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
          isThreeLine: true,
          onTap: () {
            if (!notification.isRead) {
              Provider.of<NotificationProvider>(context, listen: false)
                  .markAsRead(notification.id);
            }
          },
        ),
      ),
    );
  }
}
