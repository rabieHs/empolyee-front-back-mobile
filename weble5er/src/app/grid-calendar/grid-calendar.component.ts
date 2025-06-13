import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../services/requests.service';
import { Request } from '../models/request.model';

@Component({
  selector: 'app-grid-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './grid-calendar.component.html',
  styleUrls: ['./grid-calendar.component.css']
})
export class GridCalendarComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: number;
  currentYear: number;
  
  // Données du calendrier
  daysInMonth: number[] = [];
  daysOfWeek: string[] = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];
  weeks: any[] = [];
  employees: any[] = [];
  requests: Request[] = [];
  
  // Mois en français
  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(private requestsService: RequestsService) {
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
  }

  ngOnInit(): void {
    this.loadRequests();
    this.generateCalendar();
  }

  loadRequests(): void {
    // Récupérer toutes les demandes
    this.requests = this.requestsService.getAllRequests();
    console.log('Demandes chargées:', this.requests);
    
    // Extraire les employés uniques des demandes
    const uniqueEmployees = new Map();
    
    this.requests.forEach(request => {
      if (request.user && request.user.id) {
        const employeeId = request.user.id;
        const employeeName = request.user.firstName && request.user.lastName 
          ? `${request.user.firstName} ${request.user.lastName}`
          : `Employé ${employeeId}`;
          
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            id: employeeId,
            name: employeeName,
            code: employeeId.toString().substring(0, 4) // Code court pour l'affichage
          });
        }
      }
    });
    
    // Convertir la Map en tableau
    this.employees = Array.from(uniqueEmployees.values());
    console.log('Employés chargés:', this.employees);
    
    // Si aucun employé n'est trouvé, ajouter des exemples pour la démonstration
    if (this.employees.length === 0) {
      this.employees = [
        { id: '1001', name: 'Jean Dupont', code: '1001' },
        { id: '1002', name: 'Marie Martin', code: '1002' },
        { id: '1003', name: 'Pierre Durand', code: '1003' },
        { id: '1004', name: 'Sophie Lefebvre', code: '1004' },
        { id: '1005', name: 'Thomas Bernard', code: '1005' },
        { id: '1006', name: 'Julie Moreau', code: '1006' },
        { id: '1007', name: 'Nicolas Petit', code: '1007' },
        { id: '1008', name: 'Camille Robert', code: '1008' }
      ];
      
      // Ajouter des demandes d'exemple
      this.addSampleRequests();
    }
  }
  
  addSampleRequests(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Exemple de demandes pour différents employés
    const sampleData = [
      { id: '1001', type: 'leave', status: 'approved', start: 5, end: 9 },
      { id: '1002', type: 'training', status: 'approved', start: 12, end: 16 },
      { id: '1003', type: 'leave', status: 'approved', start: 19, end: 23 },
      { id: '1004', type: 'training', status: 'pending', start: 8, end: 10 },
      { id: '1005', type: 'leave', status: 'rejected', start: 15, end: 17 },
      { id: '1006', type: 'training', status: 'approved', start: 22, end: 24 },
      { id: '1007', type: 'leave', status: 'approved', start: 1, end: 5 },
      { id: '1008', type: 'training', status: 'pending', start: 26, end: 28 }
    ];
    
    sampleData.forEach((sample, index) => {
      this.requests.push({
        id: `sample${index}`,
        user: { id: sample.id, firstName: this.employees.find(e => e.id === sample.id)?.name.split(' ')[0] || '' },
        type: sample.type,
        status: sample.status,
        start_date: new Date(currentYear, currentMonth, sample.start).toISOString(),
        end_date: new Date(currentYear, currentMonth, sample.end).toISOString()
      });
    });
  }

  generateCalendar(): void {
    // Réinitialiser les semaines
    this.weeks = [];
    
    // Obtenir le nombre de jours dans le mois
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Déterminer le premier jour du mois (0 = dimanche, 1 = lundi, etc.)
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
    // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Générer les semaines
    let day = 1;
    let weekNumber = 1;
    
    // Créer les semaines du mois
    for (let i = 0; i < 6; i++) { // Maximum 6 semaines par mois
      const week: any = {
        number: weekNumber,
        days: []
      };
      
      // Remplir les jours de la semaine
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < startingDay) || day > daysInMonth) {
          // Jours vides avant le début du mois ou après la fin du mois
          week.days.push({
            day: null,
            isWeekend: j >= 5, // Samedi et dimanche
            date: null
          });
        } else {
          // Jours du mois
          const date = new Date(this.currentYear, this.currentMonth, day);
          week.days.push({
            day: day,
            isWeekend: j >= 5, // Samedi et dimanche
            date: date
          });
          day++;
        }
      }
      
      this.weeks.push(week);
      weekNumber++;
      
      // Arrêter si tous les jours du mois ont été ajoutés
      if (day > daysInMonth) {
        break;
      }
    }
  }
  
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }
  
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }
  
  getRequestForEmployeeAndDay(employeeId: string, day: number): any {
    if (!day) return null;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Chercher une demande pour cet employé à cette date
    const request = this.requests.find(req => {
      if (req.user?.id !== employeeId) return false;
      
      if (!req.start_date || !req.end_date) return false;
      
      const startDate = new Date(req.start_date);
      const endDate = new Date(req.end_date);
      
      // Normaliser les dates pour comparer uniquement les jours
      const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return normalizedDate >= normalizedStartDate && normalizedDate <= normalizedEndDate;
    });
    
    return request;
  }
  
  getCellContent(employeeId: string, day: number): string {
    if (!day) return '';
    
    const request = this.getRequestForEmployeeAndDay(employeeId, day);
    if (!request) return 'J'; // Jour normal (Jour de travail)
    
    if (request.type === 'leave') {
      return 'C'; // Congé
    } else if (request.type === 'training') {
      return 'F'; // Formation
    } else {
      return 'A'; // Autre type d'absence
    }
  }
  
  getCellColor(employeeId: string, day: number): string {
    if (!day) return '';
    
    const request = this.getRequestForEmployeeAndDay(employeeId, day);
    if (!request) return ''; // Pas de couleur pour les jours normaux
    
    if (request.status === 'approved') {
      if (request.type === 'leave') {
        return '#a8e6a8'; // Vert clair pour congé approuvé
      } else if (request.type === 'training') {
        return '#ffe0b3'; // Orange clair pour formation approuvée
      }
    } else if (request.status === 'pending') {
      return '#fff2b3'; // Jaune clair pour en attente
    } else if (request.status === 'rejected') {
      return '#ffb3b3'; // Rouge clair pour rejeté
    }
    
    return '';
  }
  
  isWeekend(day: number): boolean {
    if (!day) return false;
    
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi
    
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
}
