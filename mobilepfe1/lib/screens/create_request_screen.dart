import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/request_provider.dart';
import '../services/shared_storage_service.dart';
import '../models/request.dart';

class CreateRequestScreen extends StatefulWidget {
  final String requestType;

  const CreateRequestScreen({
    Key? key,
    required this.requestType,
  }) : super(key: key);

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();

  late String _selectedRequestType;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 1));
  int _durationInDays = 1;

  // Service de stockage partagé pour ajouter les demandes
  final _sharedStorageService = SharedStorageService();

  @override
  void initState() {
    super.initState();
    _selectedRequestType = widget.requestType;
    _calculateDuration();
  }

  void _calculateDuration() {
    // Calculer la durée en jours entre la date de début et la date de fin
    _durationInDays = _endDate.difference(_startDate).inDays + 1;
    setState(() {});
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectStartDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );

    if (picked != null && picked != _startDate) {
      setState(() {
        _startDate = picked;
        // Si la date de fin est avant la date de début, on la met à jour
        if (_endDate.isBefore(_startDate)) {
          _endDate = _startDate;
        }
        // Mettre à jour la durée
        _calculateDuration();
      });
    }
  }

  Future<void> _selectEndDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate.isBefore(_startDate) ? _startDate : _endDate,
      firstDate: _startDate,
      lastDate: DateTime(2100),
    );

    if (picked != null && picked != _endDate) {
      setState(() {
        _endDate = picked;
        // Mettre à jour la durée
        _calculateDuration();
      });
    }
  }

  Future<void> _submitRequest() async {
    if (_formKey.currentState!.validate()) {
      try {
        // Formater les dates au format ISO
        final startDateStr = DateFormat('yyyy-MM-dd').format(_startDate);
        final endDateStr = DateFormat('yyyy-MM-dd').format(_endDate);

        // Générer la description complète
        String description = _descriptionController.text.trim();
        if (description.isEmpty) {
          // Si la description est vide, générer une description par défaut
          description =
              'Congé du ${DateFormat('yyyy-MM-dd').format(_startDate)} au ${DateFormat('yyyy-MM-dd').format(_endDate)} ($_durationInDays jour${_durationInDays > 1 ? 's' : ''})';
        }

        // Créer une map pour stocker les détails spécifiques au type de demande
        Map<String, dynamic> details = {};

        // Ajouter les détails spécifiques en fonction du type de demande
        if (_selectedRequestType == 'Congé') {
          details = {
            'leaveType': _selectedLeaveType,
            'dayPart': _selectedDayPart,
            'reason': _reasonController.text,
          };
        } else if (_selectedRequestType == 'Formation') {
          details = {
            'title': _titleController.text,
            'organization': _organizationController.text,
            'trainingType': _selectedTrainingType,
            'objectives': _descriptionController.text,
            'cost': _costController.text,
          };
        } else if (_selectedRequestType == 'Demande de prêt') {
          details = {
            'loanType': _selectedLoanType,
            'amount': _amountController.text,
            'reason': _descriptionController.text,
          };
        } else if (_selectedRequestType == 'Demande d\'avance') {
          details = {
            'amount': _amountController.text,
            'reason': _descriptionController.text,
          };
        } else {
          // Pour les demandes de document et attestation
          details = {
            'reason': _descriptionController.text,
          };
        }

        // Créer l'objet Request
        final request = Request(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          type: _selectedRequestType,
          description: _descriptionController.text,
          startDate: _startDate.toIso8601String(),
          endDate: _endDate.toIso8601String(),
          status: 'En attente',
          createdAt: DateTime.now().toIso8601String(),
          userId: 1, // Convertir en int car le modèle attend un int
          details: details,
        );

        // Ajouter la demande via le provider
        await Provider.of<RequestProvider>(context, listen: false)
            .createRequest(
          type: _selectedRequestType,
          startDate: _startDate.toIso8601String(),
          endDate: _endDate.toIso8601String(),
          description: _descriptionController.text,
          details: details,
        );

        // Afficher un message de succès
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Demande créée avec succès'),
            backgroundColor: Colors.green,
          ),
        );

        // Retourner à l'écran précédent
        Navigator.of(context).pop();
      } catch (e) {
        // Afficher un message d'erreur
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erreur lors de la création de la demande: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  // Champs spécifiques pour chaque type de demande
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _organizationController = TextEditingController();
  final TextEditingController _costController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _reasonController = TextEditingController();

  // Options pour les types de congé
  final List<String> _leaveTypes = [
    'Congé annuel',
    'Congé payé',
    'Congé sans solde',
    'Congé maladie',
    'Congé maternité',
    'Congé paternité'
  ];
  String _selectedLeaveType = 'Congé annuel';

  // Options pour les périodes de la journée
  final List<String> _dayParts = ['Journée complète', 'Matin', 'Après-midi'];
  String _selectedDayPart = 'Journée complète';

  // Options pour les types de formation
  final List<String> _trainingTypes = [
    'Technique',
    'Soft Skills',
    'Certification'
  ];
  String _selectedTrainingType = 'Technique';

  // Options pour les types de prêt
  final List<String> _loanTypes = [
    'Prêt personnel',
    'Prêt automobile',
    'Prêt immobilier'
  ];
  String _selectedLoanType = 'Prêt personnel';

  @override
  Widget build(BuildContext context) {
    final requestProvider = Provider.of<RequestProvider>(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Créer une nouvelle demande'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Type de demande (non modifiable)
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Type de demande',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _selectedRequestType,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

              // Champs spécifiques au type de demande
              Builder(builder: (context) {
                if (_selectedRequestType == 'Congé') {
                  return _buildLeaveRequestFields();
                } else if (_selectedRequestType == 'Formation') {
                  return _buildTrainingRequestFields();
                } else if (_selectedRequestType == 'Demande de prêt') {
                  return _buildLoanRequestFields();
                } else if (_selectedRequestType == 'Demande d\'avance') {
                  return _buildAdvanceRequestFields();
                } else {
                  return _buildDocumentRequestFields();
                }
              }),
              const SizedBox(height: 16),

              // Date de début
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Date de début',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () => _selectStartDate(context),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            DateFormat('dd/MM/yyyy').format(_startDate),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Icon(Icons.calendar_today, color: Colors.blue),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Date de fin
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Date de fin',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () => _selectEndDate(context),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            DateFormat('dd/MM/yyyy').format(_endDate),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Icon(Icons.calendar_today, color: Colors.blue),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Durée
              Container(
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[100]!),
                ),
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.blue),
                    const Icon(Icons.timelapse, color: Colors.blue),
                    const SizedBox(width: 8),
                    Text(
                      'Durée: ${_endDate.difference(_startDate).inDays + 1} jour(s)',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Description
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText: 'Entrez une description...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                ),
              ),

              // Bouton de soumission
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: requestProvider.isLoading ? null : _submitRequest,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: requestProvider.isLoading
                      ? const CircularProgressIndicator()
                      : const Text(
                          'Soumettre la demande',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Construction du formulaire de demande de congé
  Widget _buildLeaveRequestFields() {
    return Column(
      children: [
        // Type de congé
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Type de congé',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedLeaveType,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                items: _leaveTypes.map((String type) {
                  return DropdownMenuItem<String>(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedLeaveType = newValue;
                      // Ajuster automatiquement la date de fin pour congé maternité/paternité
                      if (newValue == 'Congé maternité') {
                        _endDate = _startDate
                            .add(const Duration(days: 98)); // 14 semaines
                      } else if (newValue == 'Congé paternité') {
                        _endDate = _startDate.add(const Duration(days: 25));
                      }
                      _calculateDuration();
                    });
                  }
                },
              ),
            ],
          ),
        ),

        // Période de la journée
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Période de la journée',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedDayPart,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                items: _dayParts.map((String part) {
                  return DropdownMenuItem<String>(
                    value: part,
                    child: Text(part),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedDayPart = newValue;
                    });
                  }
                },
              ),
            ],
          ),
        ),

        // Motif
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Motif',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Précisez le motif de votre demande...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez préciser le motif';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Construction du formulaire de demande de formation
  Widget _buildTrainingRequestFields() {
    return Column(
      children: [
        // Titre de la formation
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Titre de la formation',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: 'Entrez le titre de la formation',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer le titre de la formation';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),

        // Organisme de formation
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Organisme de formation',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _organizationController,
                decoration: const InputDecoration(
                  hintText: 'Entrez le nom de l\'organisme',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer l\'organisme de formation';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),

        // Type de formation
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Type de formation',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedTrainingType,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                items: _trainingTypes.map((String type) {
                  return DropdownMenuItem<String>(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedTrainingType = newValue;
                    });
                  }
                },
              ),
            ],
          ),
        ),

        // Objectifs de la formation
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Objectifs de la formation',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Décrivez les objectifs de la formation',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez décrire les objectifs';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),

        // Coût estimé
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Coût estimé (DT)',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _costController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Entrez le coût estimé',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer le coût estimé';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Construction du formulaire de demande de prêt
  Widget _buildLoanRequestFields() {
    return Column(
      children: [
        // Type de prêt
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Type de prêt',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedLoanType,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                items: _loanTypes.map((String type) {
                  return DropdownMenuItem<String>(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedLoanType = newValue;
                    });
                  }
                },
              ),
            ],
          ),
        ),

        // Montant du prêt
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Montant du prêt (DT)',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Entrez le montant du prêt',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer le montant du prêt';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),

        // Motif du prêt
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Motif du prêt',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Précisez le motif de votre demande de prêt',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez préciser le motif';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Construction du formulaire de demande d'avance
  Widget _buildAdvanceRequestFields() {
    return Column(
      children: [
        // Montant de l'avance
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Montant de l\'avance (DT)',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Entrez le montant de l\'avance',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer le montant de l\'avance';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),

        // Motif de l'avance
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Motif de l\'avance',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Précisez le motif de votre demande d\'avance',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez préciser le motif';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Construction du formulaire de demande de document
  Widget _buildDocumentRequestFields() {
    return Column(
      children: [
        // Type de document
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Type de document',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _selectedRequestType,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),

        // Motif de la demande
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Motif de la demande',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Précisez le motif de votre demande',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez préciser le motif';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
