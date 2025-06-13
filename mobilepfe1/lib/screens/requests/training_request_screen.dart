import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../models/request.dart';
import '../../providers/request_provider.dart';
import '../../widgets/file_picker_widget.dart';

class TrainingRequestScreen extends StatefulWidget {
  final String? requestId;
  
  const TrainingRequestScreen({Key? key, this.requestId}) : super(key: key);

  @override
  State<TrainingRequestScreen> createState() => _TrainingRequestScreenState();
}

class _TrainingRequestScreenState extends State<TrainingRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _organizationController = TextEditingController();
  final _objectivesController = TextEditingController();
  final _costController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _submitError;
  String? _submitSuccess;
  bool get _isEditMode => widget.requestId != null;
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 1));
  File? _selectedFile;
  String _selectedTrainingType = 'technical';
  
  // Départements et thèmes
  String _selectedDepartment = '';
  String _selectedTheme = '';
  String _selectedTopic = '';
  List<String> _availableTopics = [];
  
  // Structure des départements, thèmes et sujets
  final List<Map<String, dynamic>> _departments = [
    {
      'id': 'dev',
      'name': 'Développement',
      'themes': [
        {
          'id': 'web',
          'name': 'Développement Web',
          'topics': ['Angular', 'React', 'Vue.js', 'Node.js', 'PHP', 'Django']
        },
        {
          'id': 'mobile',
          'name': 'Développement Mobile',
          'topics': ['React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)']
        },
        {
          'id': 'backend',
          'name': 'Backend & API',
          'topics': ['Spring Boot', 'Express.js', 'ASP.NET Core', 'GraphQL']
        },
        {
          'id': 'devops',
          'name': 'DevOps & Cloud',
          'topics': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD']
        },
        {
          'id': 'data',
          'name': 'Data & BI',
          'topics': ['SQL', 'NoSQL', 'Power BI', 'Tableau', 'Big Data']
        }
      ]
    }
  ];
  
  // Types de formation
  final List<Map<String, String>> _trainingTypes = [
    {'value': 'technical', 'label': 'Technique'},
    {'value': 'soft', 'label': 'Soft Skills'},
    {'value': 'certification', 'label': 'Certification'}
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
  
  void _onDepartmentChange() {
    final department = _departments.firstWhere(
      (d) => d['id'] == _selectedDepartment,
      orElse: () => {'themes': []}
    );
    
    setState(() {
      _selectedTheme = '';
      _selectedTopic = '';
      _availableTopics = [];
    });
  }
  
  void _onThemeChange() {
    if (_selectedDepartment.isEmpty || _selectedTheme.isEmpty) {
      setState(() {
        _availableTopics = [];
        _selectedTopic = '';
      });
      return;
    }
    
    final department = _departments.firstWhere(
      (d) => d['id'] == _selectedDepartment,
      orElse: () => {'themes': []}
    );
    
    final theme = (department['themes'] as List).firstWhere(
      (t) => t['id'] == _selectedTheme,
      orElse: () => {'topics': []}
    );
    
    setState(() {
      _availableTopics = List<String>.from(theme['topics'] ?? []);
      _selectedTopic = '';
    });
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
          'title': _titleController.text,
          'organization': _organizationController.text,
          'trainingType': _selectedTrainingType,
          'objectives': _objectivesController.text,
          'cost': _costController.text,
          'department': _selectedDepartment,
          'theme': _selectedTheme,
          'topic': _selectedTopic,
          'hasAttachment': _selectedFile != null,
          'attachmentName': _selectedFile?.path.split('/').last ?? '',
        };
        
        // Description de la demande
        final String description = 'Formation: ${_titleController.text}';
        
        if (_isEditMode) {
          // Logique pour mettre à jour une demande existante
          // À implémenter
          setState(() {
            _submitSuccess = "Demande modifiée avec succès.";
          });
        } else {
          // Ajouter une nouvelle demande
          await Provider.of<RequestProvider>(context, listen: false).createRequest(
            type: 'Formation',
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
    _titleController.dispose();
    _organizationController.dispose();
    _objectivesController.dispose();
    _costController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Modifier la demande de formation' : 'Nouvelle demande de formation'),
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
              
              // Titre de la formation
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Titre de la formation',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un titre';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Organisme de formation
              TextFormField(
                controller: _organizationController,
                decoration: const InputDecoration(
                  labelText: 'Organisme de formation',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un organisme';
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
                  decoration: const InputDecoration(
                    labelText: 'Date de fin',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    DateFormat('dd/MM/yyyy').format(_endDate),
                  ),
                ),
              ),
              const SizedBox(height: 16.0),
              
              // Département
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Département',
                  border: OutlineInputBorder(),
                ),
                value: _selectedDepartment.isEmpty ? null : _selectedDepartment,
                hint: const Text('Sélectionnez un département'),
                items: _departments.map((dept) {
                  return DropdownMenuItem<String>(
                    value: dept['id'] as String,
                    child: Text(dept['name'] as String),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedDepartment = value!;
                    _onDepartmentChange();
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un département';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Thème de formation (si un département est sélectionné)
              if (_selectedDepartment.isNotEmpty)
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Thème de formation',
                    border: OutlineInputBorder(),
                  ),
                  value: _selectedTheme.isEmpty ? null : _selectedTheme,
                  hint: const Text('Sélectionnez un thème'),
                  items: _departments
                      .firstWhere(
                        (d) => d['id'] == _selectedDepartment,
                        orElse: () => {'themes': []}
                      )['themes']
                      .map<DropdownMenuItem<String>>((theme) {
                        return DropdownMenuItem<String>(
                          value: theme['id'] as String,
                          child: Text(theme['name'] as String),
                        );
                      }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedTheme = value!;
                      _onThemeChange();
                    });
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez sélectionner un thème';
                    }
                    return null;
                  },
                ),
              if (_selectedDepartment.isNotEmpty)
                const SizedBox(height: 16.0),
              
              // Sujet spécifique (si un thème est sélectionné)
              if (_selectedTheme.isNotEmpty && _availableTopics.isNotEmpty)
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Sujet spécifique',
                    border: OutlineInputBorder(),
                  ),
                  value: _selectedTopic.isEmpty ? null : _selectedTopic,
                  hint: const Text('Sélectionnez un sujet'),
                  items: _availableTopics.map((topic) {
                    return DropdownMenuItem<String>(
                      value: topic,
                      child: Text(topic),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedTopic = value!;
                    });
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez sélectionner un sujet';
                    }
                    return null;
                  },
                ),
              if (_selectedTheme.isNotEmpty && _availableTopics.isNotEmpty)
                const SizedBox(height: 16.0),
              
              // Type de formation
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Type de formation',
                  border: OutlineInputBorder(),
                ),
                value: _selectedTrainingType,
                items: _trainingTypes.map((type) {
                  return DropdownMenuItem<String>(
                    value: type['value'],
                    child: Text(type['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedTrainingType = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez sélectionner un type de formation';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Objectifs de la formation
              TextFormField(
                controller: _objectivesController,
                decoration: const InputDecoration(
                  labelText: 'Objectifs de la formation',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer les objectifs';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),
              
              // Coût de la formation
              TextFormField(
                controller: _costController,
                decoration: const InputDecoration(
                  labelText: 'Coût de la formation (DT)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un coût';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Veuillez entrer un nombre valide';
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
