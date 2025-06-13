import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../models/request.dart';
import '../../providers/request_provider.dart';
import '../../widgets/file_picker_widget.dart';

class LeaveRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const LeaveRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends State<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  
  String _selectedLeaveType = 'annuel';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 1));
  String _selectedDayPart = 'full';
  File? _selectedFile;
  
  // Options pour les types de congé
  final List<Map<String, String>> _leaveTypes = [
    {'value': 'annuel', 'label': 'Congé annuel (weekends inclus)'},
    {'value': 'paid', 'label': 'Congé payé'},
    {'value': 'unpaid', 'label': 'Congé sans solde'},
    {'value': 'sick', 'label': 'Congé maladie'},
    {'value': 'maternity', 'label': 'Congé maternité'},
    {'value': 'paternity', 'label': 'Congé paternité'}
  ];
  
  // Options pour les périodes de la journée
  final List<Map<String, String>> _dayParts = [
    {'value': 'full', 'label': 'Journée complète'},
    {'value': 'morning', 'label': 'Matin'},
    {'value': 'afternoon', 'label': 'Après-midi'}
  ];
  
  @override
  void initState() {
    super.initState();
    
    if (_isEditMode) {
      // Charger les données de la demande existante
      _loadExistingRequest();
    }
  }
  
  void _loadExistingRequest() {
    // Implémenter la logique pour charger une demande existante
    // à partir de l'ID fourni dans widget.requestId
  }
  
  void _onLeaveTypeChange() {
    if (_selectedLeaveType == 'maternity' || _selectedLeaveType == 'paternity') {
      // Calculer la date de fin en fonction du type de congé
      final days = _selectedLeaveType == 'maternity' ? 98 : 25;
      final end = DateTime(_startDate.year, _startDate.month, _startDate.day + days);
      setState(() {
        _endDate = end;
      });
    }
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
        
        // Mettre à jour la date de fin pour les congés spéciaux
        _onLeaveTypeChange();
      });
    }
  }
  
  Future<void> _selectEndDate(BuildContext context) async {
    // Ne pas permettre la sélection pour les congés maternité/paternité
    if (_selectedLeaveType == 'maternity' || _selectedLeaveType == 'paternity') {
      return;
    }
    
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate.isBefore(_startDate) ? _startDate : _endDate,
      firstDate: _startDate,
      lastDate: DateTime(2100),
    );
    
    if (picked != null && picked != _endDate) {
      setState(() {
        _endDate = picked;
      });
    }
  }
  
  Future<void> _submitRequest() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isSubmitting = true;
        _submitError = null;
        _submitSuccess = null;
      });
      
      try {
        // Créer les détails de la demande
        final Map<String, dynamic> details = {
          'leaveType': _selectedLeaveType,
          'dayPart': _selectedDayPart,
          'reason': _reasonController.text,
          'hasAttachment': _selectedFile != null,
          'attachmentName': _selectedFile?.path.split('/').last ?? '',
        };
        
        // Description de la demande
        final String description = 'Demande de congé du ${DateFormat('yyyy-MM-dd').format(_startDate)} au ${DateFormat('yyyy-MM-dd').format(_endDate)}';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Congé',
            startDate: _startDate.toIso8601String(),
            endDate: _endDate.toIso8601String(),
            description: description,
            details: details,
          );
          
          setState(() {
            _submitSuccess = "Demande envoyée avec succès.";
          });
        }
        
        // Attendre un peu avant de retourner à l'écran précédent
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            Navigator.of(context).pop();
          }
        });
      } catch (e) {
        setState(() {
          _submitError = "Erreur lors de l'envoi de la demande: $e";
        });
      } finally {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
  
  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Messages de feedback
              if (_submitError != null)
                Container(
                  padding: const EdgeInsets.all(8.0),
                  margin: const EdgeInsets.only(bottom: 16.0),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    borderRadius: BorderRadius.circular(4.0),
                  ),
                  child: Text(
                    _submitError!,
                    style: TextStyle(color: Colors.red.shade800),
                  ),
                ),
                
              if (_submitSuccess != null)
                Container(
                  padding: const EdgeInsets.all(8.0),
                  margin: const EdgeInsets.only(bottom: 16.0),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    borderRadius: BorderRadius.circular(4.0),
                  ),
                  child: Text(
                    _submitSuccess!,
                    style: TextStyle(color: Colors.green.shade800),
                  ),
                ),
              
              // Type de congé
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Type de congé',
                  border: OutlineInputBorder(),
                ),
                value: _selectedLeaveType,
                items: _leaveTypes.map((type) {
                  return DropdownMenuItem<String>(
                    value: type['value'],
                    child: Text(type['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedLeaveType = value!;
                    _onLeaveTypeChange();
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un type de congé';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Date de début
              InkWell(
                onTap: () => _selectStartDate(context),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date de début',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    DateFormat('dd/MM/yyyy').format(_startDate),
                  ),
                ),
              ),
              const SizedBox(height: 16.0),
              
              // Date de fin
              InkWell(
                onTap: () => _selectEndDate(context),
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Date de fin',
                    border: const OutlineInputBorder(),
                    suffixIcon: const Icon(Icons.calendar_today),
                    enabled: !(_selectedLeaveType == 'maternity' || _selectedLeaveType == 'paternity'),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        DateFormat('dd/MM/yyyy').format(_endDate),
                      ),
                      if (_selectedLeaveType == 'maternity')
                        const Text(
                          'La date de fin est automatiquement calculée à 98 jours après la date de début (14 semaines)',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      if (_selectedLeaveType == 'paternity')
                        const Text(
                          'La date de fin est automatiquement calculée à 25 jours après la date de début',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16.0),
              
              // Période de la journée
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Période de la journée',
                  border: OutlineInputBorder(),
                ),
                value: _selectedDayPart,
                items: _dayParts.map((part) {
                  return DropdownMenuItem<String>(
                    value: part['value'],
                    child: Text(part['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedDayPart = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner une période';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Motif
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'Motif',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un motif';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24.0),
              
              // Documents justificatifs
              const SizedBox(height: 16.0),
              FilePickerWidget(
                onFileSelected: (file) {
                  setState(() {
                    _selectedFile = file;
                  });
                },
                allowedExtensions: ['pdf', 'doc', 'docx'],
              ),
              const SizedBox(height: 24.0),
              
              // Boutons d'action
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Annuler'),
                  ),
                  const SizedBox(width: 16.0),
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitRequest,
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_isEditMode ? 'Enregistrer' : 'Soumettre'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
