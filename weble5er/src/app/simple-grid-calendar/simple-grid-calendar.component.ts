import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-simple-grid-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1>{{ currentMonth }}</h1>
        <div>
          <button (click)="previousMonth()" style="margin-right: 10px; padding: 8px 15px; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 4px;">
            &lt; Mois précédent
          </button>
          <button (click)="nextMonth()" style="padding: 8px 15px; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 4px;">
            Mois suivant &gt;
          </button>
        </div>
      </div>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; width: 80px;">Code</th>
              <ng-container *ngFor="let day of days">
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: center; min-width: 30px;">
                  {{ day }}
                </th>
              </ng-container>
            </tr>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;"></th>
              <ng-container *ngFor="let dayName of dayNames">
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
                  {{ employee.code }}
                </td>
                <ng-container *ngFor="let day of days">
                  <td 
                    style="border: 1px solid #ddd; padding: 8px; text-align: center; height: 30px;"
                    [style.background-color]="getBackgroundColor(employee.id, day)">
                    {{ getContent(employee.id, day) }}
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
  `,
  styles: []
})
export class SimpleGridCalendarComponent {
  // Données statiques pour l'exemple
  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  monthIndex: number = new Date().getMonth();
  currentMonth: string = this.months[this.monthIndex];
  
  // Jours du mois (1-31)
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // Jours de la semaine
  dayNames: string[] = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];
  
  // Employés
  employees = [
    { id: '1001', code: '1001', name: 'Jean Dupont' },
    { id: '1002', code: '1002', name: 'Marie Martin' },
    { id: '1003', code: '1003', name: 'Pierre Durand' },
    { id: '1004', code: '1004', name: 'Sophie Lefebvre' },
    { id: '1005', code: '1005', name: 'Thomas Bernard' },
    { id: '1006', code: '1006', name: 'Julie Moreau' },
    { id: '1007', code: '1007', name: 'Nicolas Petit' },
    { id: '1008', code: '1008', name: 'Camille Robert' }
  ];
  
  // Données de congés et formations (statiques pour l'exemple)
  data = [
    { employeeId: '1001', day: 5, type: 'leave', status: 'approved' },
    { employeeId: '1001', day: 6, type: 'leave', status: 'approved' },
    { employeeId: '1001', day: 7, type: 'leave', status: 'approved' },
    { employeeId: '1001', day: 8, type: 'leave', status: 'approved' },
    { employeeId: '1001', day: 9, type: 'leave', status: 'approved' },
    
    { employeeId: '1002', day: 12, type: 'training', status: 'approved' },
    { employeeId: '1002', day: 13, type: 'training', status: 'approved' },
    { employeeId: '1002', day: 14, type: 'training', status: 'approved' },
    { employeeId: '1002', day: 15, type: 'training', status: 'approved' },
    { employeeId: '1002', day: 16, type: 'training', status: 'approved' },
    
    { employeeId: '1003', day: 19, type: 'leave', status: 'approved' },
    { employeeId: '1003', day: 20, type: 'leave', status: 'approved' },
    { employeeId: '1003', day: 21, type: 'leave', status: 'approved' },
    { employeeId: '1003', day: 22, type: 'leave', status: 'approved' },
    { employeeId: '1003', day: 23, type: 'leave', status: 'approved' },
    
    { employeeId: '1004', day: 8, type: 'training', status: 'pending' },
    { employeeId: '1004', day: 9, type: 'training', status: 'pending' },
    { employeeId: '1004', day: 10, type: 'training', status: 'pending' },
    
    { employeeId: '1005', day: 15, type: 'leave', status: 'rejected' },
    { employeeId: '1005', day: 16, type: 'leave', status: 'rejected' },
    { employeeId: '1005', day: 17, type: 'leave', status: 'rejected' },
    
    { employeeId: '1006', day: 22, type: 'training', status: 'approved' },
    { employeeId: '1006', day: 23, type: 'training', status: 'approved' },
    { employeeId: '1006', day: 24, type: 'training', status: 'approved' },
    
    { employeeId: '1007', day: 1, type: 'leave', status: 'approved' },
    { employeeId: '1007', day: 2, type: 'leave', status: 'approved' },
    { employeeId: '1007', day: 3, type: 'leave', status: 'approved' },
    { employeeId: '1007', day: 4, type: 'leave', status: 'approved' },
    { employeeId: '1007', day: 5, type: 'leave', status: 'approved' },
    
    { employeeId: '1008', day: 26, type: 'training', status: 'pending' },
    { employeeId: '1008', day: 27, type: 'training', status: 'pending' },
    { employeeId: '1008', day: 28, type: 'training', status: 'pending' }
  ];
  
  // Navigation entre les mois
  previousMonth(): void {
    this.monthIndex = (this.monthIndex - 1 + 12) % 12;
    this.currentMonth = this.months[this.monthIndex];
  }
  
  nextMonth(): void {
    this.monthIndex = (this.monthIndex + 1) % 12;
    this.currentMonth = this.months[this.monthIndex];
  }
  
  // Obtenir la couleur de fond pour une cellule
  getBackgroundColor(employeeId: string, day: number): string {
    const item = this.data.find(d => d.employeeId === employeeId && d.day === day);
    if (!item) return '';
    
    if (item.status === 'approved') {
      if (item.type === 'leave') {
        return '#a8e6a8'; // Vert clair pour congé approuvé
      } else if (item.type === 'training') {
        return '#ffe0b3'; // Orange clair pour formation approuvée
      }
    } else if (item.status === 'pending') {
      return '#fff2b3'; // Jaune clair pour en attente
    } else if (item.status === 'rejected') {
      return '#ffb3b3'; // Rouge clair pour rejeté
    }
    
    return '';
  }
  
  // Obtenir le contenu d'une cellule
  getContent(employeeId: string, day: number): string {
    const item = this.data.find(d => d.employeeId === employeeId && d.day === day);
    if (!item) return 'J'; // Jour normal (Jour de travail)
    
    if (item.type === 'leave') {
      return 'C'; // Congé
    } else if (item.type === 'training') {
      return 'F'; // Formation
    } else {
      return 'A'; // Autre type d'absence
    }
  }
}
