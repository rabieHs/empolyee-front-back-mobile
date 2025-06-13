import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../services/requests.service';
import { Request } from '../models/request.model';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: string;
  isCurrentMonth: boolean;
}

interface CalendarWeek {
  days: CalendarDay[];
}

interface Employee {
  id: string;
  name: string;
}

@Component({
  selector: 'app-monthly-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './monthly-calendar.component.html',
  styleUrls: ['./monthly-calendar.component.css']
})
export class MonthlyCalendarComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: number;
  currentYear: number;
  weeks: CalendarWeek[] = [];
  employees: Employee[] = [];
  requests: Request[] = [];
  
  // Options d'affichage
  showLeaveRequests: boolean = true;
  showTrainingRequests: boolean = true;
  showApprovedRequests: boolean = true;
  showPendingRequests: boolean = true;
  showRejectedRequests: boolean = true;

  // Jours de la semaine
  daysOfWeek: string[] = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
    const uniqueEmployees = new Map<string, Employee>();
    
    this.requests.forEach(request => {
      if (request.user && request.user.id) {
        const employeeName = request.user.firstName && request.user.lastName 
          ? `${request.user.firstName} ${request.user.lastName}`.toUpperCase()
          : `Employé ${request.user.id}`;
          
        uniqueEmployees.set(request.user.id, {
          id: request.user.id,
          name: employeeName
        });
      }
    });
    
    // Convertir la Map en tableau
    this.employees = Array.from(uniqueEmployees.values());
    console.log('Employés chargés:', this.employees);
    
    // Si aucun employé n'est trouvé, ajouter des exemples pour la démonstration
    if (this.employees.length === 0) {
      this.employees = [
        { id: '1', name: 'ALAIN' },
        { id: '2', name: 'ANDRÉA' },
        { id: '3', name: 'DENIS' },
        { id: '4', name: 'ERIC' },
        { id: '5', name: 'FRANCIS' },
        { id: '6', name: 'LUCIE' },
        { id: '7', name: 'MARC' }
      ];
      
      // Ajouter des demandes d'exemple
      this.addSampleRequests();
    }
  }
  
  addSampleRequests(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Exemple de demandes pour ALAIN
    this.requests.push({
      id: 'sample1',
      user: { id: '1', firstName: 'Alain', lastName: '' },
      type: 'leave',
      status: 'approved',
      start_date: new Date(currentYear, currentMonth, 10).toISOString(),
      end_date: new Date(currentYear, currentMonth, 14).toISOString()
    });
    
    // Exemple de demandes pour ANDRÉA
    this.requests.push({
      id: 'sample2',
      user: { id: '2', firstName: 'Andréa', lastName: '' },
      type: 'leave',
      status: 'approved',
      start_date: new Date(currentYear, currentMonth, 20).toISOString(),
      end_date: new Date(currentYear, currentMonth, 24).toISOString()
    });
    
    // Exemple de demandes pour ERIC
    this.requests.push({
      id: 'sample3',
      user: { id: '4', firstName: 'Eric', lastName: '' },
      type: 'leave',
      status: 'rejected',
      start_date: new Date(currentYear, currentMonth, 5).toISOString(),
      end_date: new Date(currentYear, currentMonth, 7).toISOString()
    });
    
    // Exemple de demande sans solde pour ERIC
    this.requests.push({
      id: 'sample4',
      user: { id: '4', firstName: 'Eric', lastName: '' },
      type: 'leave',
      status: 'approved',
      description: 'Sans solde',
      start_date: new Date(currentYear, currentMonth, 25).toISOString(),
      end_date: new Date(currentYear, currentMonth, 25).toISOString()
    });
    
    // Exemple de demandes pour MARC
    this.requests.push({
      id: 'sample5',
      user: { id: '7', firstName: 'Marc', lastName: '' },
      type: 'leave',
      status: 'approved',
      start_date: new Date(currentYear, currentMonth, 1).toISOString(),
      end_date: new Date(currentYear, currentMonth, 5).toISOString()
    });
    
    // Exemple de demandes pour FRANCIS
    this.requests.push({
      id: 'sample6',
      user: { id: '5', firstName: 'Francis', lastName: '' },
      type: 'leave',
      status: 'approved',
      start_date: new Date(currentYear, currentMonth, 15).toISOString(),
      end_date: new Date(currentYear, currentMonth, 19).toISOString()
    });
  }

  generateCalendar(): void {
    this.weeks = [];
    
    // Déterminer le premier jour du mois
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    
    // Déterminer le dernier jour du mois
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Trouver le premier jour de la semaine (lundi = 1, dimanche = 0)
    let firstDayOfCalendar = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuster pour commencer le lundi
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - diff);
    
    // Générer les semaines du calendrier
    let currentDate = new Date(firstDayOfCalendar);
    
    // Générer 6 semaines pour être sûr de couvrir tout le mois
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: CalendarWeek = { days: [] };
      
      // Générer les jours de la semaine
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day: CalendarDay = {
          date: new Date(currentDate),
          dayOfMonth: currentDate.getDate(),
          dayOfWeek: this.getDayOfWeekLabel(currentDate.getDay()),
          isCurrentMonth: currentDate.getMonth() === this.currentMonth
        };
        
        week.days.push(day);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      this.weeks.push(week);
      
      // Arrêter si on a dépassé le mois
      if (currentDate.getMonth() !== this.currentMonth && currentDate.getDate() > 7) {
        break;
      }
    }
  }
  
  getDayOfWeekLabel(day: number): string {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[day];
  }
  
  getMonthName(month: number): string {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[month];
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
  
  getRequestsForEmployeeAndDate(employeeId: string, date: Date): Request[] {
    if (!this.requests || !employeeId) return [];
    
    const dateString = date.toISOString().split('T')[0];
    
    return this.requests.filter(request => {
      // Vérifier si la demande appartient à cet employé
      if (request.user?.id !== employeeId) return false;
      
      // Filtrer par type si nécessaire
      if (request.type === 'leave' && !this.showLeaveRequests) return false;
      if (request.type === 'training' && !this.showTrainingRequests) return false;
      
      // Filtrer par statut si nécessaire
      if (request.status === 'approved' && !this.showApprovedRequests) return false;
      if (request.status === 'pending' && !this.showPendingRequests) return false;
      if (request.status === 'rejected' && !this.showRejectedRequests) return false;
      
      // Vérifier si la date est dans la plage de la demande
      if (!request.start_date || !request.end_date) return false;
      
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      // Normaliser les dates pour comparer uniquement les jours
      const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return normalizedDate >= normalizedStartDate && normalizedDate <= normalizedEndDate;
    });
  }
  
  getCellColor(employeeId: string, date: Date): string {
    const requests = this.getRequestsForEmployeeAndDate(employeeId, date);
    if (requests.length === 0) return '';
    
    // Prioriser l'affichage des demandes
    const request = requests[0];
    
    if (request.status === 'approved') {
      if (request.description === 'Sans solde') {
        return '#b3d9ff'; // Bleu clair pour sans solde
      } else if (request.type === 'leave') {
        return '#a8e6a8'; // Vert clair pour congé
      } else if (request.type === 'training') {
        return '#ffe0b3'; // Orange clair pour formation
      }
    } else if (request.status === 'pending') {
      return '#fff2b3'; // Jaune clair pour en attente
    } else if (request.status === 'rejected') {
      return '#ffb3b3'; // Rouge clair pour rejeté
    }
    
    return '';
  }
  
  getCellText(employeeId: string, date: Date): string {
    const requests = this.getRequestsForEmployeeAndDate(employeeId, date);
    if (requests.length === 0) return '';
    
    const request = requests[0];
    
    if (request.description === 'Sans solde') {
      return 'Sans solde';
    } else if (request.status === 'rejected') {
      return 'Maladie';
    } else if (request.type === 'leave') {
      return 'Congés';
    } else if (request.type === 'training') {
      return 'Formation';
    }
    
    return '';
  }
  
  formatDate(date: Date): string {
    return `${date.getDate()} ${this.getMonthName(date.getMonth())}. ${date.getFullYear()}`;
  }
}
