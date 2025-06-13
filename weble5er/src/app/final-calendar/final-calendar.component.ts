import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RequestsService } from '../services/requests.service';

@Component({
  selector: 'app-final-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <h1>{{ months[currentMonth] }}</h1>
      
      <div style="margin: 15px 0;">
        <button (click)="previousMonth()" style="margin-right: 10px; padding: 8px 15px; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 4px;">
          &lt; Mois précédent
        </button>
        <button (click)="nextMonth()" style="padding: 8px 15px; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 4px;">
          Mois suivant &gt;
        </button>
      </div>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; width: 80px;">ID</th>
              <ng-container *ngFor="let day of days; let i = index">
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: center;">
                  {{ day }}
                </th>
              </ng-container>
            </tr>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;"></th>
              <ng-container *ngFor="let dayName of dayNames; let i = index">
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: center;">
                  {{ dayName }}
                </th>
              </ng-container>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let employee of employees">
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f9f9;">
                  {{ employee.id }}
                </td>
                <ng-container *ngFor="let day of days; let i = index">
                  <td 
                    style="border: 1px solid #ddd; padding: 8px; text-align: center;"
                    [style.background-color]="getCellColor(employee.id, day)">
                    {{ getCellContent(employee.id, day) }}
                  </td>
                </ng-container>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 20px;">
        <h3>Légende</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #a8e6a8; margin-right: 5px; border: 1px solid #ddd;"></div>
            <span>C - Congés</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #ffe0b3; margin-right: 5px; border: 1px solid #ddd;"></div>
            <span>F - Formation</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #fff2b3; margin-right: 5px; border: 1px solid #ddd;"></div>
            <span>En attente</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #ffb3b3; margin-right: 5px; border: 1px solid #ddd;"></div>
            <span>Refusé</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span>J - Jour de travail</span>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <button routerLink="/home" style="padding: 8px 15px; background-color: #3f51b5; color: white; border: none; border-radius: 4px;">
          Retour au tableau de bord
        </button>
      </div>
    </div>
  `
})
export class FinalCalendarComponent implements OnInit {
  // Données du calendrier
  currentDate: Date = new Date();
  currentMonth: number;
  currentYear: number;
  days: number[] = [];
  dayNames: string[] = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];
  
  // Données des employés et demandes
  employees: any[] = [];
  requests: any[] = [];
  
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
    // Charger les demandes depuis le service
    this.requests = this.requestsService.getAllRequests();
    console.log('Demandes chargées:', this.requests);
    
    // Extraire les employés des demandes
    this.loadEmployeesFromRequests();
    
    // Générer les jours du mois
    this.generateDaysOfMonth();
  }

  loadEmployeesFromRequests(): void {
    // Extraire les employés uniques des demandes
    const uniqueEmployees = new Map();
    
    this.requests.forEach(request => {
      if (request.user && request.user.id) {
        const employeeId = request.user.id;
        
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            id: employeeId,
            name: request.user.firstName && request.user.lastName 
              ? `${request.user.firstName} ${request.user.lastName}`
              : `Employé ${employeeId}`
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
        { id: '1001', name: 'Jean Dupont' },
        { id: '1002', name: 'Marie Martin' },
        { id: '1003', name: 'Pierre Durand' },
        { id: '1004', name: 'Sophie Lefebvre' },
        { id: '1005', name: 'Thomas Bernard' }
      ];
      
      // Ajouter des demandes d'exemple
      this.addSampleRequests();
    }
  }
  
  addSampleRequests(): void {
    // Exemple de demandes pour différents employés
    const sampleData = [
      { employeeId: '1001', type: 'leave', status: 'approved', days: [5, 6, 7] },
      { employeeId: '1005', type: 'leave', status: 'rejected', days: [3, 4, 5] }
    ];
    
    // Créer des demandes d'exemple
    sampleData.forEach((sample, index) => {
      sample.days.forEach(day => {
        this.requests.push({
          id: `sample${index}-${day}`,
          user: { 
            id: sample.employeeId, 
            firstName: this.employees.find(e => e.id === sample.employeeId)?.name.split(' ')[0] || '' 
          },
          type: sample.type,
          status: sample.status,
          day: day
        });
      });
    });
  }

  generateDaysOfMonth(): void {
    // Obtenir le nombre de jours dans le mois
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }
  
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateDaysOfMonth();
  }
  
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateDaysOfMonth();
  }
  
  getRequestForEmployeeAndDay(employeeId: string, day: number): any {
    // Chercher une demande pour cet employé à cette date
    return this.requests.find(req => {
      if (req.user?.id !== employeeId) return false;
      
      // Si la demande a un jour spécifique (pour les exemples)
      if (req.day) return req.day === day;
      
      // Si la demande a des dates de début et de fin
      if (req.start_date && req.end_date) {
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);
        const currentDate = new Date(this.currentYear, this.currentMonth, day);
        
        // Normaliser les dates pour comparer uniquement les jours
        const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        return normalizedCurrentDate >= normalizedStartDate && normalizedCurrentDate <= normalizedEndDate;
      }
      
      return false;
    });
  }
  
  getCellColor(employeeId: string, day: number): string {
    const request = this.getRequestForEmployeeAndDay(employeeId, day);
    if (!request) return '';
    
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
  
  getCellContent(employeeId: string, day: number): string {
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
}
