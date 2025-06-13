import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../models/request.dart';
import '../../providers/request_provider.dart';
import '../../widgets/file_picker_widget.dart';

class AdvanceRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const AdvanceRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<AdvanceRequestScreen> createState() => _AdvanceRequestScreenState();
}

class _AdvanceRequestScreenState extends State<AdvanceRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _advanceAmountController = TextEditingController();
  final _advanceReasonController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  File? _selectedFile;
  
  // Limite maximale pour le montant de l'avance
  final double _maxAdvanceAmount = 2000000;
  
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
          'advanceAmount': double.tryParse(_advanceAmountController.text) ?? 0,
          'advanceReason': _advanceReasonController.text,
          'hasAttachment': _selectedFile != null,
          'attachmentName': _selectedFile?.path.split('/').last ?? '',
        };
        
        // Description de la demande
        final String description = 'Demande d\'avance de ${_advanceAmountController.text} DT';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Demande d\'avance',
            startDate: DateTime.now().toIso8601String(),
            endDate: DateTime.now().toIso8601String(), // Même date pour une demande d'avance
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
    _advanceAmountController.dispose();
    _advanceReasonController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Modifier la demande d\'avance' : 'Nouvelle demande d\'avance'),
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
              
              // Montant de l'avance
              TextFormField(
                controller: _advanceAmountController,
                decoration: const InputDecoration(
                  labelText: 'Montant de l\'avance (DT)',
                  border: OutlineInputBorder(),
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
                  
                  if (amount > _maxAdvanceAmount) {
                    return 'Le montant ne doit pas dépasser $_maxAdvanceAmount DT';
                  }
                  
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Motif de l'avance
              TextFormField(
                controller: _advanceReasonController,
                decoration: const InputDecoration(
                  labelText: 'Motif de l\'avance',
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
              const SizedBox(height: 16.0),
              
              // Pièce jointe (optionnel dans cette implémentation)
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(4.0),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Pièce jointe',
                      style: TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8.0),
                    ElevatedButton.icon(
                      onPressed: () {
                        // Implémenter la sélection de fichier
                        // Cette fonctionnalité nécessite des plugins supplémentaires
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Fonctionnalité non implémentée dans cette version'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.attach_file),
                      label: const Text('Ajouter un fichier'),
                    ),
                    const SizedBox(height: 8.0),
                    const Text(
                      'Formats acceptés: PDF, DOC, DOCX',
                      style: TextStyle(
                        fontSize: 12.0,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24.0),
              
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
