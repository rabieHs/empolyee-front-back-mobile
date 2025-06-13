import 'dart:convert';
class Request {
  final String id;
  final int userId;
  final String type;
  final String status;
  final String startDate;
  final String endDate;
  final String description;
  final Map<String, dynamic>? details;
  final String? createdAt;
  final String? updatedAt;
  
  // Informations supplémentaires de l'utilisateur
  final String? firstname;
  final String? lastname;
  final String? email;
  final String? role;
  final String? department;
  final String? position;
  
  // Source de la demande (web ou mobile)
  final String? source;

  Request({
    required this.id,
    required this.userId,
    required this.type,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.description,
    this.details,
    this.createdAt,
    this.updatedAt,
    this.firstname,
    this.lastname,
    this.email,
    this.role,
    this.department,
    this.position,
    this.source,
  });

  factory Request.fromJson(Map<String, dynamic> json) {
    return Request(
      id: json['id'],
      userId: json['user_id'] is String ? int.parse(json['user_id']) : json['user_id'],
      type: json['type'],
      status: json['status'],
      startDate: json['start_date'],
      endDate: json['end_date'],
      description: json['description'] ?? '',
      details: json['details'] != null 
          ? json['details'] is String 
              ? jsonDecode(json['details']) 
              : json['details']
          : null,
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      firstname: json['firstname'],
      lastname: json['lastname'],
      email: json['email'],
      role: json['role'],
      department: json['department'],
      position: json['position'],
      source: json['source'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'type': type,
      'status': status,
      'start_date': startDate,
      'end_date': endDate,
      'description': description,
      'details': details != null ? jsonEncode(details) : null,
      'source': source ?? 'mobile', // Indiquer que la demande provient de l'application mobile par défaut
      'created_at': createdAt,
      'updated_at': updatedAt,
      'firstname': firstname,
      'lastname': lastname,
      'email': email,
      'role': role,
      'department': department,
      'position': position,
    };
  }

  String get userName => firstname != null && lastname != null 
      ? '$firstname $lastname' 
      : 'Utilisateur';

  String get formattedDate {
    try {
      // Essayer de parser les dates au format yyyy-MM-dd
      DateTime start = DateTime.parse(startDate);
      DateTime end = DateTime.parse(endDate);
      
      if (start.year == end.year && start.month == end.month && start.day == end.day) {
        return '${start.day}/${start.month}/${start.year}';
      } else {
        return 'Du ${start.day}/${start.month}/${start.year} au ${end.day}/${end.month}/${end.year}';
      }
    } catch (e) {
      // Si le parsing échoue, retourner les dates telles quelles
      if (startDate == endDate) {
        return startDate;
      } else {
        return 'Du $startDate au $endDate';
      }
    }
  }

  int get durationInDays {
    try {
      DateTime start = DateTime.parse(startDate);
      DateTime end = DateTime.parse(endDate);
      return end.difference(start).inDays + 1;
    } catch (e) {
      // Si le parsing échoue, retourner une durée par défaut de 1 jour
      return 1;
    }
  }

  String get statusText {
    switch (status.toLowerCase()) {
      case 'en attente':
        return 'En attente';
      case 'approuvée':
        return 'Approuvée';
      case 'refusée':
        return 'Refusée';
      case 'chef approuvé':
        return 'Approuvée par le chef';
      case 'chef refusé':
        return 'Refusée par le chef';
      default:
        return status;
    }
  }
}
