import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-basic-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px; text-align: center;">
      <h1>Administration de Base</h1>
      <p>Ceci est une page d'administration très simple pour tester l'affichage.</p>
      <div class="admin-links">
        <button routerLink="/admin/requests-calendar" class="calendar-btn">Calendrier des Demandes</button>
        <button routerLink="/home" class="home-btn">Retour à l'accueil</button>
      </div>
    </div>
  `,
  styles: [`
    h1 { color: #3f51b5; margin-bottom: 20px; }
    p { margin-bottom: 25px; color: #555; }
    .admin-links {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
    }
    button { 
      background-color: #3f51b5; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 4px; 
      cursor: pointer; 
      font-weight: 500;
      transition: all 0.3s ease;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .calendar-btn {
      background-color: #4caf50;
    }
    .home-btn {
      background-color: #3f51b5;
    }
  `]
})
export class BasicAdminComponent {
  constructor() {
    console.log('BasicAdminComponent initialized');
  }
}
