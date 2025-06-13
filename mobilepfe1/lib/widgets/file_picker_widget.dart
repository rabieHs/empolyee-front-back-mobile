import 'package:flutter/material.dart';
import 'dart:io';
import 'package:file_picker/file_picker.dart';

class FilePickerWidget extends StatefulWidget {
  final Function(File?) onFileSelected;
  final List<String> allowedExtensions;
  
  const FilePickerWidget({
    Key? key,
    required this.onFileSelected,
    this.allowedExtensions = const ['pdf', 'doc', 'docx'],
  }) : super(key: key);

  @override
  State<FilePickerWidget> createState() => _FilePickerWidgetState();
}

class _FilePickerWidgetState extends State<FilePickerWidget> {
  File? _selectedFile;
  
  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: widget.allowedExtensions,
      );
      
      if (result != null) {
        setState(() {
          _selectedFile = File(result.files.single.path!);
        });
        widget.onFileSelected(_selectedFile);
      }
    } catch (e) {
      // Gérer les erreurs de sélection de fichier
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur lors de la sélection du fichier: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Documents justificatifs',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _selectedFile != null
                      ? _selectedFile!.path.split('/').last
                      : 'Aucun fichier choisi',
                  style: TextStyle(
                    color: _selectedFile != null ? Colors.black87 : Colors.grey,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: _pickFile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey.shade200,
                  foregroundColor: Colors.black87,
                ),
                child: const Text('Choisir un fichier'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Formats acceptés: ${widget.allowedExtensions.map((e) => e.toUpperCase()).join(", ")}',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }
}
