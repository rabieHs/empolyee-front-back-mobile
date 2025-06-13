import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/request.dart';
import '../../providers/request_provider.dart';

class DocumentRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const DocumentRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<DocumentRequestScreen> createState() => _DocumentRequestScreenState();
}

class _DocumentRequestScreenState extends State<DocumentRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _objectiveController = TextEditingController();
  final _commentsController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  
  String _selectedDocumentType = '';
  String _selectedUrgency = 'normal';
  String _selectedLanguage = 'fr';
  int _copies = 1;
  
  // Types de document
  final List<String> _documentTypes = [
    'Attestation de travail',
    'Attestation de salaire',
    'Attestation de présence',
    'Autre'
  ];
  
  // Niveaux d'urgence
  final List<Map<String, String>> _urgencyLevels = [
    {'value': 'normal', 'label': 'Normale'},
    {'value': 'high', 'label': 'Haute'},
    {'value': 'urgent', 'label': 'Urgente'}
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
          'documentType': _selectedDocumentType,
          'reason': _reasonController.text,
          'urgency': _selectedUrgency,
          'objective': _objectiveController.text,
          'language': _selectedLanguage,
          'copies': _copies,
          'comments': _commentsController.text,
        };
        
        // Description de la demande
        final String description = 'Demande de document - $_selectedDocumentType';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Document administratif',
            startDate: DateTime.now().toIso8601String(),
            endDate: DateTime.now().toIso8601String(), // Même date pour une demande de document
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
    _objectiveController.dispose();
    _commentsController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Modifier la demande de document' : 'Nouvelle demande de document'),
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
              
              // Type de document
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Type de document',
                  border: OutlineInputBorder(),
                ),
                value: _selectedDocumentType.isEmpty ? null : _selectedDocumentType,
                hint: const Text('Sélectionnez un type de document'),
                items: _documentTypes.map((type) {
                  return DropdownMenuItem<String>(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedDocumentType = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un type de document';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Motif de la demande
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'Motif de la demande',
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
              
              // Niveau d'urgence
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Niveau d\'urgence',
                  border: OutlineInputBorder(),
                ),
                value: _selectedUrgency,
                items: _urgencyLevels.map((level) {
                  return DropdownMenuItem<String>(
                    value: level['value'],
                    child: Text(level['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedUrgency = value!;
                  });
                },
              ),
              const SizedBox(height: 16.0),
              
              // Objectif du document
              TextFormField(
                controller: _objectiveController,
                decoration: const InputDecoration(
                  labelText: 'Objectif du document',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16.0),
              
              // Langue du document
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Langue du document',
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
              ),
              const SizedBox(height: 16.0),
              
              // Nombre de copies
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Nombre de copies',
                  border: OutlineInputBorder(),
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
                  
                  return null;
                },
                onChanged: (value) {
                  final int? copies = int.tryParse(value);
                  if (copies != null && copies > 0) {
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
