import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../models/request.dart';
import '../../providers/request_provider.dart';
import '../../widgets/file_picker_widget.dart';

class LoanRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const LoanRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<LoanRequestScreen> createState() => _LoanRequestScreenState();
}

class _LoanRequestScreenState extends State<LoanRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _loanAmountController = TextEditingController();
  final _reasonController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  
  String _selectedLoanType = 'personal';
  File? _selectedFile;
  
  // Informations sur le salaire et le plafond de prêt
  final Map<String, double> _loanInfo = {
    'monthlySalary': 3000, // Salaire mensuel par défaut
    'loanCap': 1200 // 40% du salaire mensuel
  };
  
  // Types de prêt
  final List<Map<String, String>> _loanTypes = [
    {'value': 'personal', 'label': 'Prêt personnel'},
    {'value': 'car', 'label': 'Prêt automobile'},
    {'value': 'house', 'label': 'Prêt immobilier'}
  ];
  
  @override
  void initState() {
    super.initState();
    
    // Calculer le plafond de prêt
    _calculateLoanCap();
    
    if (_isEditMode) {
      // Charger les données de la demande existante
      _loadExistingRequest();
    }
  }
  
  void _calculateLoanCap() {
    // Dans une application réelle, vous récupéreriez le salaire de l'utilisateur depuis le backend
    _loanInfo['loanCap'] = _loanInfo['monthlySalary']! * 0.4;
  }
  
  void _loadExistingRequest() {
    // Implémenter la logique pour charger une demande existante
    // à partir de l'ID fourni dans widget.requestId
  }
  
  String _getLoanTypeLabel(String type) {
    switch (type) {
      case 'personal':
        return 'personnel';
      case 'car':
        return 'automobile';
      case 'house':
        return 'immobilier';
      default:
        return '';
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
          'loanType': _selectedLoanType,
          'loanAmount': double.parse(_loanAmountController.text),
          'reason': _reasonController.text,
          'hasAttachment': _selectedFile != null,
          'attachmentName': _selectedFile?.path.split('/').last ?? '',
        };
        
        // Description de la demande
        final String description = 'Demande de prêt ${_getLoanTypeLabel(_selectedLoanType)} de ${_loanAmountController.text} DT';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Demande de prêt',
            startDate: DateTime.now().toIso8601String(),
            endDate: DateTime.now().toIso8601String(), // Même date pour une demande de prêt
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
    _loanAmountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Modifier la demande de prêt' : 'Nouvelle demande de prêt'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Informations sur le salaire et le plafond de prêt
              Container(
                padding: const EdgeInsets.all(16.0),
                margin: const EdgeInsets.only(bottom: 16.0),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Salaire mensuel: ${NumberFormat.currency(locale: 'fr', symbol: 'DT', decimalDigits: 0).format(_loanInfo['monthlySalary'])}',
                      style: const TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8.0),
                    Text(
                      'Plafond de prêt disponible: ${NumberFormat.currency(locale: 'fr', symbol: 'DT', decimalDigits: 0).format(_loanInfo['loanCap'])}',
                      style: const TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    const Text(
                      '(40% de votre salaire mensuel)',
                      style: TextStyle(
                        fontSize: 12.0,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              
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
              
              // Type de prêt
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Type de prêt',
                  border: OutlineInputBorder(),
                ),
                value: _selectedLoanType,
                items: _loanTypes.map((type) {
                  return DropdownMenuItem<String>(
                    value: type['value'],
                    child: Text(type['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedLoanType = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un type de prêt';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Montant du prêt
              TextFormField(
                controller: _loanAmountController,
                decoration: InputDecoration(
                  labelText: 'Montant du prêt (DT)',
                  border: const OutlineInputBorder(),
                  helperText: 'Maximum: ${NumberFormat.currency(locale: 'fr', symbol: 'DT', decimalDigits: 0).format(_loanInfo['loanCap'])}',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un montant';
                  }
                  
                  final double? amount = double.tryParse(value);
                  if (amount == null) {
                    return 'Veuillez entrer un nombre valide';
                  }
                  
                  if (amount <= 0) {
                    return 'Le montant doit être positif';
                  }
                  
                  if (amount > _loanInfo['loanCap']!) {
                    return 'Le montant ne peut pas dépasser ${NumberFormat.currency(locale: 'fr', symbol: 'DT', decimalDigits: 0).format(_loanInfo['loanCap'])}';
                  }
                  
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Raison de la demande
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'Raison de la demande',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer une raison';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Documents justificatifs
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
