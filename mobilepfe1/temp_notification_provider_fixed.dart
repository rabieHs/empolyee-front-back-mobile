import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/notification.dart' as app_notification;
import '../services/notification_service.dart';
import '../utils/constants.dart';

class NotificationProvider with ChangeNotifier {
  final NotificationService _notificationService = NotificationService();
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  StreamSubscription? _notificationSubscription;
  
  List<app_notification.Notification> _notifications = [];
  List<app_notification.Notification> _unreadNotifications = [];
  bool _isLoading = false;
  String? _error;
  
  NotificationProvider() {
    _initializeNotifications();
    _subscribeToRealTimeNotifications();
  }
  
  List<app_notification.Notification> get notifications => _notifications;
  List<app_notification.Notification> get unreadNotifications => _unreadNotifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Récupérer toutes les notifications de l'utilisateur
  Future<void> fetchUserNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _notifications = await _notificationService.getUserNotifications();
      _unreadNotifications = _notifications.where((notification) => !notification.isRead).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Méthode pour la compatibilité avec le code existant
  Future<void> fetchNotifications() async {
    await fetchUserNotifications();
  }
  
  // Effacer les erreurs
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  // Initialiser les notifications locales
  void _initializeNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('app_icon');
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );
    
    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Naviguer vers l'écran des notifications lorsque l'utilisateur clique sur une notification
        print('Notification cliquée: ${response.payload}');
      },
    );
  }
  
  // S'abonner aux notifications en temps réel
  void _subscribeToRealTimeNotifications() {
    _notificationSubscription = _notificationService.notificationsStream.listen((notifications) {
      // Mettre à jour la liste des notifications
      _notifications = notifications;
      
      // Mettre à jour la liste des notifications non lues
      _unreadNotifications = _notifications.where((notification) => !notification.isRead).toList();
      
      // Afficher une notification locale pour chaque nouvelle notification non lue
      for (var notification in _unreadNotifications) {
        _showLocalNotification(notification);
      }
      
      notifyListeners();
    }, onError: (error) {
      print('Erreur lors de la réception des notifications en temps réel: $error');
      _error = error.toString();
      notifyListeners();
    });
  }
  
  // Marquer une notification comme lue
  Future<void> markAsRead(String notificationId) async {
    try {
      await _notificationService.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      final index = _notifications.indexWhere((notification) => notification.id == notificationId);
      if (index != -1) {
        final updatedNotification = app_notification.Notification(
          id: _notifications[index].id,
          userId: _notifications[index].userId,
          title: _notifications[index].title,
          message: _notifications[index].message,
          type: _notifications[index].type,
          isRead: true,
          date: _notifications[index].date,
          readAt: DateTime.now(),
        );
        
        _notifications[index] = updatedNotification;
        _unreadNotifications = _notifications.where((notification) => !notification.isRead).toList();
        
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  // Marquer toutes les notifications comme lues
  Future<void> markAllAsRead() async {
    try {
      // Mettre à jour l'état local
      _notifications = _notifications.map((notification) {
        return app_notification.Notification(
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: true,
          date: notification.date,
          readAt: DateTime.now(),
        );
      }).toList();
      
      _unreadNotifications = [];
      
      notifyListeners();
      
      // Mettre à jour sur le serveur
      // Cette fonctionnalité n'est pas encore implémentée côté serveur
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  // Supprimer toutes les notifications
  Future<void> clearAllNotifications() async {
    try {
      await _notificationService.clearAllNotifications();
      
      // Mettre à jour l'état local
      _notifications = [];
      _unreadNotifications = [];
      
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  // Afficher une notification locale
  Future<void> _showLocalNotification(app_notification.Notification notification) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'eya_mobile_channel',
      'Notifications Portail RH',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );
    
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );
    
    // Déterminer l'icône et la couleur en fonction du type de notification
    String title = notification.title;
    String body = notification.message;
    
    // Ajouter un préfixe au titre en fonction du type de notification
    if (notification.type == 'approval') {
      title = '✅ ' + title;
    } else if (notification.type == 'rejection') {
      title = '❌ ' + title;
    } else if (notification.type == 'new_request') {
      title = '🆕 ' + title;
    }
    
    await _flutterLocalNotificationsPlugin.show(
      notification.id.hashCode,
      title,
      body,
      platformChannelSpecifics,
      payload: notification.id,
    );
  }
  
  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }
}
