import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RequestsService } from '../services/requests.service';
import { Request } from '../models/request.model';

@Component({
  selector: 'app-employee-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1 style="color: #3f51b5; margin-bottom: 20px;">Calendrier des Demandes</h1>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button (click)="previousMonth()" style="background-color: #3f51b5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          <span>&#8592;</span> Mois précédent
        </button>
        <h2>{{ months[currentMonth.getMonth()] }} {{ currentMonth.getFullYear() }}</h2>
        <button (click)="nextMonth()" style="background-color: #3f51b5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Mois suivant <span>&#8594;</span>
        </button>
      </div>
      
      <!-- Légende -->
      <div style="margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #4CAF50; margin-right: 5px;"></div>
          <span>Congé approuvé</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #2196F3; margin-right: 5px;"></div>
          <span>Congé en attente</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #F44336; margin-right: 5px;"></div>
          <span>Congé rejeté</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #8BC34A; margin-right: 5px;"></div>
          <span>Formation approuvée</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #03A9F4; margin-right: 5px;"></div>
          <span>Formation en attente</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 15px; height: 15px; background-color: #FF5722; margin-right: 5px;"></div>
          <span>Formation rejetée</span>
        </div>
      </div>
      
      <div style="border: 1px solid #ddd; border-radius: 4px;">
        <!-- Jours de la semaine -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); background-color: #f5f5f5; border-bottom: 1px solid #ddd;">
          <div *ngFor="let day of weekdays" style="padding: 10px; text-align: center; font-weight: bold;">{{ day }}</div>
        </div>
        
        <!-- Jours du mois -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr);">
          <div *ngFor="let day of calendarDays" 
               style="border: 1px solid #eee; padding: 8px; min-height: 100px; background-color: {{ day.number === 0 ? '#f9f9f9' : 'white' }}">
            <div *ngIf="day.number !== 0">
              <div style="font-weight: bold; margin-bottom: 5px;">{{ day.number }}</div>
              <div *ngFor="let request of day.requests" 
                   style="margin-bottom: 5px; padding: 5px; border-radius: 4px; font-size: 12px; 
                   background-color: {{ getRequestColor(request.type, request.status) }}; color: white;">
                {{ request.type === 'leave' ? 'Congé' : 'Formation' }} - {{ request.user?.firstName || 'Employé' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <button routerLink="/home" style="background-color: #3f51b5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
          Retour au tableau de bord
        </button>
      </div>
    </div>
  `,
  styleUrl: './employee-calendar.component.scss'
})
export class EmployeeCalendarComponent implements OnInit {
  currentMonth: Date = new Date();
  calendarDays: { number: number, requests: Request[] }[] = [];
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  months: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Toutes les demandes
  allRequests: Request[] = [];
  
  constructor(private requestsService: RequestsService) {}

  ngOnInit() {
    // Récupérer toutes les demandes
    this.loadRequests();
    
    // Générer le calendrier initial
    this.generateCalendar();
  }
  
  loadRequests() {
    this.allRequests = this.requestsService.getAllRequests();
    console.log('Demandes chargées:', this.allRequests);
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Premier jour du mois (0 = dimanche, 1 = lundi, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Initialiser le tableau des jours
    this.calendarDays = [];
    
    // Ajouter les cases vides pour les jours avant le premier jour du mois
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ number: 0, requests: [] });
    }
    
    // Ajouter les jours du mois avec leurs demandes
    for (let i = 1; i <= daysInMonth; i++) {
      const dayRequests = this.getRequestsForDay(i);
      this.calendarDays.push({ number: i, requests: dayRequests });
    }
    
    // Compléter la dernière semaine avec des cases vides si nécessaire
    const remainingCells = 42 - this.calendarDays.length; // 6 semaines * 7 jours = 42
    for (let i = 0; i < remainingCells; i++) {
      this.calendarDays.push({ number: 0, requests: [] });
    }
  }
  
  getRequestsForDay(day: number): Request[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
    
    // Filtrer les demandes qui tombent dans cette journée
    return this.allRequests.filter(request => {
      if (!request.start_date || !request.end_date) return false;
      
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      // Vérifier si la journée est comprise entre la date de début et la date de fin de la demande
      return (dayStart <= endDate && dayEnd >= startDate);
    });
  }
  
  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }
  
  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }
  
  getRequestColor(type: string | undefined, status: string | undefined): string {
    const typeLower = type?.toLowerCase() || '';
    const statusLower = status?.toLowerCase() || '';
    
    // Couleur par défaut pour les congés
    if (typeLower.includes('congé') || typeLower.includes('conge') || typeLower === 'leave') {
      if (statusLower.includes('approuvée') || statusLower.includes('approved')) {
        return '#4CAF50'; // Vert pour approuvé
      } else if (statusLower.includes('rejetée') || statusLower.includes('rejected')) {
        return '#F44336'; // Rouge pour rejeté
      } else {
        return '#2196F3'; // Bleu pour en attente
      }
    } 
    // Couleur pour les formations
    else if (typeLower.includes('formation') || typeLower === 'training') {
      if (statusLower.includes('approuvée') || statusLower.includes('approved')) {
        return '#8BC34A'; // Vert clair pour approuvé
      } else if (statusLower.includes('rejetée') || statusLower.includes('rejected')) {
        return '#FF5722'; // Orange pour rejeté
      } else {
        return '#03A9F4'; // Bleu clair pour en attente
      }
    }
    // Couleur par défaut pour les autres types
    else {
      return '#9E9E9E'; // Gris pour les autres types
    }
  }
}
