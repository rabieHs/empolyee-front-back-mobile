import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../services/requests.service';
import { AuthService } from '../services/auth.service';
import { Request } from '../models/request.model';
import { User } from '../models/user.model';

@Component({
  selector: 'app-ultra-simple-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ultra-simple-calendar.component.html',
  styleUrl: './ultra-simple-calendar.component.scss'
})
export class UltraSimpleCalendarComponent implements OnInit {
  // Données
  employees: User[] = [];
  requests: Request[] = [];
  
  // Périodes
  currentDate: Date = new Date();
  weeks: any[] = [];
  weekCount: number = 4; // Nombre de semaines à afficher
  
  // Filtres
  showLeaveRequests: boolean = true;
  showTrainingRequests: boolean = true;
  
  constructor(
    private requestsService: RequestsService,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    this.loadEmployees();
    this.loadRequests();
    this.generateWeeks();
  }
  
  // Charger les employés à partir des demandes
  loadEmployees() {
    // Récupérer les demandes
    const requests = this.requestsService.getAllRequests();
    
    // Extraire les utilisateurs uniques des demandes
    const uniqueEmployees = new Map<string, User>();
    
    requests.forEach(request => {
      if (request.user && request.user.id && !uniqueEmployees.has(request.user.id)) {
        uniqueEmployees.set(request.user.id, request.user);
      }
    });
    
    // Convertir la Map en tableau
    this.employees = Array.from(uniqueEmployees.values());
    console.log('Employés chargés:', this.employees);
  }
  
  // Charger les demandes
  loadRequests() {
    this.requests = this.requestsService.getAllRequests();
    console.log('Demandes chargées:', this.requests);
  }
  
  // Générer les semaines pour le calendrier
  generateWeeks() {
    this.weeks = [];
    
    // Déterminer le premier jour de la semaine (lundi)
    const today = new Date(this.currentDate);
    const dayOfWeek = today.getDay() || 7; // 0 = dimanche, 1-6 = lundi-samedi, convertir 0 en 7
    const diff = today.getDate() - dayOfWeek + 1; // Ajuster pour commencer un lundi
    
    const mondayOfCurrentWeek = new Date(today.setDate(diff));
    
    // Générer les semaines
    for (let weekIndex = 0; weekIndex < this.weekCount; weekIndex++) {
      const weekStart = new Date(mondayOfCurrentWeek);
      weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
      
      const days = [];
      
      // Générer les jours de la semaine (lundi à dimanche)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        
        days.push({
          date: date,
          dayOfMonth: date.getDate(),
          dayOfWeek: dayIndex,
          isWeekend: dayIndex === 5 || dayIndex === 6, // Vendredi et Samedi sont considérés comme week-end
          isToday: this.isToday(date)
        });
      }
      
      this.weeks.push({
        weekNumber: weekIndex + 1,
        startDate: new Date(weekStart),
        endDate: new Date(weekStart.setDate(weekStart.getDate() + 6)),
        days: days
      });
    }
    
    console.log('Semaines générées:', this.weeks);
  }
  
  // Vérifier si une date est aujourd'hui
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }
  
  // Formater une date pour l'affichage
  formatDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // Obtenir les demandes pour un employé et une date spécifique
  getRequestsForEmployeeAndDate(employeeId: string, date: Date): Request[] {
    if (!this.requests || !employeeId) return [];
    
    const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    return this.requests.filter(request => {
      // Vérifier si la demande appartient à cet employé
      if (request.user?.id !== employeeId) return false;
      
      // Filtrer par type si nécessaire
      if (request.type === 'leave' && !this.showLeaveRequests) return false;
      if (request.type === 'training' && !this.showTrainingRequests) return false;
      
      // Vérifier si la date est dans la période de la demande
      if (!request.start_date || !request.end_date) return false;
      
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      // Comparer uniquement les dates (sans l'heure)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0); // Midi pour éviter les problèmes de fuseau horaire
      
      return date >= startDate && date <= endDate;
    });
  }
  
  // Obtenir la couleur de la cellule en fonction des demandes
  getCellColor(employeeId: string, date: Date): string {
    const requests = this.getRequestsForEmployeeAndDate(employeeId, date);
    
    if (requests.length === 0) return '';
    
    // Priorité aux congés
    const leaveRequest = requests.find(r => r.type === 'leave');
    if (leaveRequest) {
      if (leaveRequest.status === 'approved') return '#a8e6a8'; // Vert clair
      if (leaveRequest.status === 'pending') return '#ffeb99'; // Jaune clair
      if (leaveRequest.status === 'rejected') return '#ffb3b3'; // Rouge clair
    }
    
    // Ensuite les formations
    const trainingRequest = requests.find(r => r.type === 'training');
    if (trainingRequest) {
      if (trainingRequest.status === 'approved') return '#b3d9ff'; // Bleu clair
      if (trainingRequest.status === 'pending') return '#e6ccff'; // Violet clair
      if (trainingRequest.status === 'rejected') return '#ffcc99'; // Orange clair
    }
    
    return '';
  }
  
  // Obtenir le texte à afficher dans la cellule
  getCellText(employeeId: string, date: Date): string {
    const requests = this.getRequestsForEmployeeAndDate(employeeId, date);
    
    if (requests.length === 0) return '';
    
    // Priorité aux congés
    const leaveRequest = requests.find(r => r.type === 'leave');
    if (leaveRequest) return 'Congés';
    
    // Ensuite les formations
    const trainingRequest = requests.find(r => r.type === 'training');
    if (trainingRequest) return 'Formation';
    
    return '';
  }
  
  // Navigation entre les périodes
  previousPeriod() {
    this.currentDate.setDate(this.currentDate.getDate() - (7 * this.weekCount));
    this.generateWeeks();
  }
  
  nextPeriod() {
    this.currentDate.setDate(this.currentDate.getDate() + (7 * this.weekCount));
    this.generateWeeks();
  }
  
  // Mettre à jour les filtres
  updateFilters() {
    // Recalculer les semaines après la mise à jour des filtres
    this.generateWeeks();
  }
}
