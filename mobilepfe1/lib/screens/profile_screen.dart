import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/user.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = false;
  User? _user;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      setState(() {
        _user = authProvider.user;
      });

      if (_user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Erreur : utilisateur non connecté."),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur lors du chargement du profil : $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateProfileImage(BuildContext context) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Fonctionnalité non implémentée')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _user == null
            ? const Center(
                child: Text(
                  'Impossible de charger le profil',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
            : _buildProfileContent();
  }

  Widget _buildProfileContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête du profil
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white,
                          width: 4,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 60,
                        backgroundColor: Colors.white,
                        backgroundImage: _user!.profileImageUrl != null
                            ? NetworkImage(_user!.profileImageUrl!)
                            : null,
                        child: _user!.profileImageUrl == null
                            ? const Icon(
                                Icons.person,
                                size: 60,
                                color: Colors.blue,
                              )
                            : null,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () => _updateProfileImage(context),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.blue,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _user!.fullName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _user!.email,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _user!.role,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Informations personnelles
          if (_user!.personalInfo != null)
            _buildInfoSection('Informations personnelles', [
              if (_user!.personalInfo!.cin != null)
                _buildInfoRow('CIN', _user!.personalInfo!.cin!),
              if (_user!.personalInfo!.dateOfBirth != null)
                _buildInfoRow(
                    'Date de naissance', _user!.personalInfo!.dateOfBirth!),
              if (_user!.personalInfo!.placeOfBirth != null)
                _buildInfoRow(
                    'Lieu de naissance', _user!.personalInfo!.placeOfBirth!),
              if (_user!.personalInfo!.nationality != null)
                _buildInfoRow('Nationalité', _user!.personalInfo!.nationality!),
              if (_user!.personalInfo!.maritalStatus != null)
                _buildInfoRow(
                    'État civil', _user!.personalInfo!.maritalStatus!),
              if (_user!.personalInfo!.numberOfChildren != null)
                _buildInfoRow('Nombre d\'enfants',
                    _user!.personalInfo!.numberOfChildren.toString()),
              if (_user!.personalInfo!.address != null)
                _buildInfoRow('Adresse', _user!.personalInfo!.address!),
              if (_user!.personalInfo!.phone != null)
                _buildInfoRow('Téléphone', _user!.personalInfo!.phone!),
            ]),

          const SizedBox(height: 16),

          // Informations professionnelles
          if (_user!.professionalInfo != null)
            _buildInfoSection('Informations professionnelles', [
              if (_user!.professionalInfo!.employeeId != null)
                _buildInfoRow(
                    'ID Employé', _user!.professionalInfo!.employeeId!),
              if (_user!.professionalInfo!.department != null)
                _buildInfoRow(
                    'Département', _user!.professionalInfo!.department!),
              if (_user!.professionalInfo!.position != null)
                _buildInfoRow('Poste', _user!.professionalInfo!.position!),
              if (_user!.professionalInfo!.hireDate != null)
                _buildInfoRow(
                    'Date d\'embauche', _user!.professionalInfo!.hireDate!),
              if (_user!.professionalInfo!.contractType != null)
                _buildInfoRow(
                    'Type de contrat', _user!.professionalInfo!.contractType!),
              if (_user!.professionalInfo!.salary != null)
                _buildInfoRow(
                    'Salaire', '${_user!.professionalInfo!.salary} DT'),
            ]),

          const SizedBox(height: 16),

          // Informations bancaires
          if (_user!.professionalInfo != null)
            _buildInfoSection('Informations bancaires', [
              if (_user!.professionalInfo!.bankName != null)
                _buildInfoRow('Banque', _user!.professionalInfo!.bankName!),
              if (_user!.professionalInfo!.rib != null)
                _buildInfoRow('RIB', _user!.professionalInfo!.rib!),
            ]),

          const SizedBox(height: 16),

          // Contact d'urgence
          if (_user!.personalInfo != null &&
              _user!.personalInfo!.emergencyContactName != null)
            _buildInfoSection('Contact d\'urgence', [
              if (_user!.personalInfo!.emergencyContactName != null)
                _buildInfoRow(
                    'Nom', _user!.personalInfo!.emergencyContactName!),
              if (_user!.personalInfo!.emergencyContactRelationship != null)
                _buildInfoRow('Relation',
                    _user!.personalInfo!.emergencyContactRelationship!),
              if (_user!.personalInfo!.emergencyContactPhone != null)
                _buildInfoRow(
                    'Téléphone', _user!.personalInfo!.emergencyContactPhone!),
            ]),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  _getSectionIcon(title),
                  color: Colors.blue,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...children,
        ],
      ),
    );
  }

  IconData _getSectionIcon(String title) {
    switch (title) {
      case 'Informations personnelles':
        return Icons.person;
      case 'Informations professionnelles':
        return Icons.work;
      case 'Informations bancaires':
        return Icons.account_balance;
      case 'Contact d\'urgence':
        return Icons.emergency;
      default:
        return Icons.info;
    }
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
