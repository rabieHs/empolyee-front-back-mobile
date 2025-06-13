import 'package:intl/intl.dart';

class DateFormatter {
  /// Formate une date au format français (dd/MM/yyyy)
  static String formatDate(String dateStr) {
    try {
      // Essayer différents formats de date
      DateTime? date;
      
      // Liste des formats possibles à essayer
      final formats = [
        'yyyy-MM-dd',
        'dd/MM/yyyy',
        'yyyy-MM-ddTHH:mm:ss',
        'yyyy-MM-dd HH:mm:ss',
        'MM/dd/yyyy',
      ];
      
      for (var format in formats) {
        try {
          date = DateFormat(format).parse(dateStr);
          break;
        } catch (e) {
          // Continuer à essayer d'autres formats
        }
      }
      
      // Si aucun format n'a fonctionné, essayer de parser manuellement
      if (date == null) {
        final parts = dateStr.split('/');
        if (parts.length == 3) {
          try {
            // Format possible: dd/MM/yyyy
            date = DateTime(
              int.parse(parts[2]),
              int.parse(parts[1]),
              int.parse(parts[0]),
            );
          } catch (e) {
            try {
              // Format possible: MM/dd/yyyy
              date = DateTime(
                int.parse(parts[2]),
                int.parse(parts[0]),
                int.parse(parts[1]),
              );
            } catch (e) {
              // Impossible de parser la date
            }
          }
        } else {
          final parts = dateStr.split('-');
          if (parts.length == 3) {
            try {
              // Format possible: yyyy-MM-dd
              date = DateTime(
                int.parse(parts[0]),
                int.parse(parts[1]),
                int.parse(parts[2]),
              );
            } catch (e) {
              // Impossible de parser la date
            }
          }
        }
      }
      
      // Si la date a été parsée avec succès, la formater
      if (date != null) {
        return DateFormat('dd/MM/yyyy').format(date);
      }
      
      // Si tout échoue, retourner la chaîne originale
      return dateStr;
    } catch (e) {
      print('Erreur lors du formatage de la date: $e');
      return dateStr;
    }
  }
  
  /// Formate une date pour l'affichage (ex: "Du 20/05/2025 au 25/05/2025")
  static String formatDateRange(String startDate, String endDate) {
    try {
      final start = formatDate(startDate);
      final end = formatDate(endDate);
      return 'Du $start au $end';
    } catch (e) {
      print('Erreur lors du formatage de la plage de dates: $e');
      return 'Du $startDate au $endDate';
    }
  }
  
  /// Formate une date avec le jour de la semaine (ex: "Lundi 26 Mai 2025")
  static String formatDateWithDay(DateTime date) {
    try {
      return DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(date);
    } catch (e) {
      print('Erreur lors du formatage de la date avec jour: $e');
      return DateFormat('dd/MM/yyyy').format(date);
    }
  }
}
