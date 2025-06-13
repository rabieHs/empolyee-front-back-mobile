class Notification {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type; // Type de notification: 'approval', 'rejection', 'new_request', etc.
  final bool isRead;
  final DateTime date;
  final DateTime? readAt;

  Notification({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.date,
    this.readAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'].toString(),
      userId: json['user_id'].toString(),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'default',
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      date: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      readAt: json['read_at'] != null 
          ? DateTime.parse(json['read_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'message': message,
      'type': type,
      'is_read': isRead ? 1 : 0,
      'created_at': date.toIso8601String(),
      'read_at': readAt?.toIso8601String(),
    };
  }

  String get formattedDate {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
  
  // Méthode copyWith pour créer une copie d'une notification avec certaines propriétés modifiées
  Notification copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    String? type,
    bool? isRead,
    DateTime? date,
    DateTime? readAt,
  }) {
    return Notification(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      isRead: isRead ?? this.isRead,
      date: date ?? this.date,
      readAt: readAt ?? this.readAt,
    );
  }
}
