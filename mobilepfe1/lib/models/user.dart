class User {
  final int id;
  final String firstname;
  final String lastname;
  final String email;
  final String role;
  final String? profileImageUrl;
  final PersonalInfo? personalInfo;
  final ProfessionalInfo? professionalInfo;

  User({
    required this.id,
    required this.firstname,
    required this.lastname,
    required this.email,
    required this.role,
    this.profileImageUrl,
    this.personalInfo,
    this.professionalInfo,
  });

  String get fullName => '$firstname $lastname';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      firstname: json['firstname'] ?? '',
      lastname: json['lastname'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      profileImageUrl: json['profile_image_url'],
      personalInfo: json['personal_info'] != null
          ? PersonalInfo.fromJson(json['personal_info'])
          : null,
      professionalInfo: json['professional_info'] != null
          ? ProfessionalInfo.fromJson(json['professional_info'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstname': firstname,
      'lastname': lastname,
      'email': email,
      'role': role,
      'profile_image_url': profileImageUrl,
      'personal_info': personalInfo?.toJson(),
      'professional_info': professionalInfo?.toJson(),
    };
  }
}

class PersonalInfo {
  final String? cin;
  final String? dateOfBirth;
  final String? placeOfBirth;
  final String? nationality;
  final String? maritalStatus;
  final int? numberOfChildren;
  final String? address;
  final String? phone;
  final String? emergencyContactName;
  final String? emergencyContactRelationship;
  final String? emergencyContactPhone;

  PersonalInfo({
    this.cin,
    this.dateOfBirth,
    this.placeOfBirth,
    this.nationality,
    this.maritalStatus,
    this.numberOfChildren,
    this.address,
    this.phone,
    this.emergencyContactName,
    this.emergencyContactRelationship,
    this.emergencyContactPhone,
  });

  factory PersonalInfo.fromJson(Map<String, dynamic> json) {
    return PersonalInfo(
      cin: json['cin'],
      dateOfBirth: json['date_of_birth'],
      placeOfBirth: json['place_of_birth'],
      nationality: json['nationality'],
      maritalStatus: json['marital_status'],
      numberOfChildren: json['number_of_children'],
      address: json['address'],
      phone: json['phone'],
      emergencyContactName: json['emergency_contact_name'],
      emergencyContactRelationship: json['emergency_contact_relationship'],
      emergencyContactPhone: json['emergency_contact_phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cin': cin,
      'date_of_birth': dateOfBirth,
      'place_of_birth': placeOfBirth,
      'nationality': nationality,
      'marital_status': maritalStatus,
      'number_of_children': numberOfChildren,
      'address': address,
      'phone': phone,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_relationship': emergencyContactRelationship,
      'emergency_contact_phone': emergencyContactPhone,
    };
  }
}

class ProfessionalInfo {
  final String? employeeId;
  final String? department;
  final String? position;
  final String? hireDate;
  final String? contractType;
  final double? salary;
  final String? bankName;
  final String? rib;

  ProfessionalInfo({
    this.employeeId,
    this.department,
    this.position,
    this.hireDate,
    this.contractType,
    this.salary,
    this.bankName,
    this.rib,
  });

  factory ProfessionalInfo.fromJson(Map<String, dynamic> json) {
    return ProfessionalInfo(
      employeeId: json['employee_id'],
      department: json['department'],
      position: json['position'],
      hireDate: json['hire_date'],
      contractType: json['contract_type'],
      salary: json['salary']?.toDouble(),
      bankName: json['bank_name'],
      rib: json['rib'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'employee_id': employeeId,
      'department': department,
      'position': position,
      'hire_date': hireDate,
      'contract_type': contractType,
      'salary': salary,
      'bank_name': bankName,
      'rib': rib,
    };
  }
}
