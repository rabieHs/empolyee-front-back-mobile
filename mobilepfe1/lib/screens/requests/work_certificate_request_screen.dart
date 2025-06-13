import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../../models/request.dart';
import '../../providers/request_provider.dart';
import '../../widgets/file_picker_widget.dart';

class WorkCertificateRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const WorkCertificateRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<WorkCertificateRequestScreen> createState() => _WorkCertificateRequestScreenState();
}

class _WorkCertificateRequestScreenState extends State<WorkCertificateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otherPurposeController = TextEditingController();
  final _commentsController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  
  String _selectedPurpose = 'bank';
  String _selectedLanguage = 'fr';
  int _copies = 1;
  File? _selectedFile;
  
  // Motifs de demande
  final List<Map<String, String>> _purposes = [
    {'value': 'bank', 'label': 'Demande bancaire'},
    {'value': 'visa', 'label': 'Demande de visa'},
    {'value': 'other', 'label': 'Autre'}
  ];
  
  // Langues disponibles
  final List<Map<String, String>> _languages = [
    {'value': 'fr', 'label': 'Français'},
    {'value': 'en', 'label': 'Anglais'},
    {'value': 'ar', 'label': 'Arabe'}
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
          'purpose': _selectedPurpose,
          'otherPurpose': _selectedPurpose == 'other' ? _otherPurposeController.text : '',
          'language': _selectedLanguage,
          'copies': _copies,
          'comments': _commentsController.text,
          'hasAttachment': _selectedFile != null,
          'attachmentName': _selectedFile?.path.split('/').last ?? '',
        };
        
        // Description de la demande
        final String description = 'Demande d\'attestation de travail';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Attestation de travail',
            startDate: DateTime.now().toIso8601String(),
            endDate: DateTime.now().toIso8601String(), // Même date pour une demande d'attestation
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
    _otherPurposeController.dispose();
    _commentsController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Demande d\'Attestation de Travail'),
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
              
              // Motif de la demande
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Motif de la demande',
                  border: OutlineInputBorder(),
                ),
                value: _selectedPurpose,
                items: _purposes.map((purpose) {
                  return DropdownMenuItem<String>(
                    value: purpose['value'],
                    child: Text(purpose['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedPurpose = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un motif';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Préciser le motif (si "Autre" est sélectionné)
              if (_selectedPurpose == 'other')
                TextFormField(
                  controller: _otherPurposeController,
                  decoration: const InputDecoration(
                    labelText: 'Précisez le motif',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (_selectedPurpose == 'other' && (value == null || value.isEmpty)) {
                      return 'Veuillez préciser le motif';
                    }
                    return null;
                  },
                ),
              if (_selectedPurpose == 'other')
                const SizedBox(height: 16.0),
              
              // Langue souhaitée
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Langue souhaitée',
                  border: OutlineInputBorder(),
                ),
                value: _selectedLanguage,
                items: _languages.map((lang) {
                  return DropdownMenuItem<String>(
                    value: lang['value'],
                    child: Text(lang['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedLanguage = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner une langue';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Nombre de copies
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Nombre de copies',
                  border: OutlineInputBorder(),
                  helperText: 'Maximum 5 copies',
                ),
                keyboardType: TextInputType.number,
                initialValue: _copies.toString(),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un nombre de copies';
                  }
                  
                  final int? copies = int.tryParse(value);
                  if (copies == null) {
                    return 'Veuillez entrer un nombre valide';
                  }
                  
                  if (copies < 1) {
                    return 'Le nombre de copies doit être au moins 1';
                  }
                  
                  if (copies > 5) {
                    return 'Le nombre de copies ne doit pas dépasser 5';
                  }
                  
                  return null;
                },
                onChanged: (value) {
                  final int? copies = int.tryParse(value);
                  if (copies != null && copies > 0 && copies <= 5) {
                    setState(() {
                      _copies = copies;
                    });
                  }
                },
              ),
              const SizedBox(height: 16.0),
              
              // Commentaires additionnels
              TextFormField(
                controller: _commentsController,
                decoration: const InputDecoration(
                  labelText: 'Commentaires additionnels',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
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
