import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PasswordResetService } from '../password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="forgot-password-container">
      <div class="form-box">
        <h2>Réinitialisation du mot de passe</h2>
        <p class="instruction">Entrez votre adresse e-mail pour réinitialiser votre mot de passe</p>
        
        <form (ngSubmit)="onSubmit()" *ngIf="!resetToken">
          <div class="input-box">
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              placeholder="Adresse e-mail"
              required>
            <i class='bx bxs-envelope'></i>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn" [disabled]="isLoading">
            <span *ngIf="!isLoading">Réinitialiser le mot de passe</span>
            <span *ngIf="isLoading">Traitement en cours...</span>
          </button>
          
          <p class="back-to-login">
            <a (click)="backToLogin()">Retour à la connexion</a>
          </p>
        </form>
        
        <div class="reset-link-box" *ngIf="resetToken">
          <div class="success-icon">
            <i class='bx bx-check-circle'></i>
          </div>
          <h3>Lien de réinitialisation généré</h3>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          
          <div class="reset-link">
            <a [routerLink]="['/reset-password', resetToken]">Cliquer ici pour réinitialiser votre mot de passe</a>
          </div>
          
          <button class="btn" (click)="backToLogin()">Retour à la connexion</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      padding: 20px;
    }

    .form-box {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }

    .instruction {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }

    .input-box {
      position: relative;
      margin-bottom: 20px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    }

    .input-box input {
      width: 100%;
      padding: 15px 45px 15px 15px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .input-box input:focus {
      border-color: #007bff;
      outline: none;
    }

    .input-box i {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .error-message {
      color: #dc3545;
      text-align: center;
      margin-bottom: 15px;
    }

    .success-message {
      color: #28a745;
      text-align: center;
      margin-bottom: 15px;
    }

    .btn {
      width: 100%;
      padding: 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .btn:not(:disabled):hover {
      background: #0056b3;
    }

    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .back-to-login {
      text-align: center;
      margin-top: 20px;
    }

    .back-to-login a {
      color: #007bff;
      cursor: pointer;
      text-decoration: underline;
    }

    .back-to-login a:hover {
      text-decoration: underline;
    }

    .reset-link-box {
      text-align: center;
    }

    .reset-link-box .success-icon {
      margin-bottom: 15px;
    }

    .reset-link-box .success-icon i {
      font-size: 48px;
      color: #28a745;
    }

    .reset-link-box h3 {
      margin-bottom: 10px;
      color: #28a745;
    }

    .reset-link-box p {
      margin-bottom: 20px;
      color: #666;
    }

    .reset-link-box .reset-link {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
      word-break: break-all;
    }

    .reset-link-box .reset-link a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }

    .reset-link-box .reset-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class ForgotPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  resetToken: string | null = null;

  constructor(
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.resetToken = null;

    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre adresse e-mail';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Veuillez entrer une adresse e-mail valide';
      return;
    }

    this.isLoading = true;

    // Générer un token de réinitialisation
    const token = this.passwordResetService.generateResetToken(this.email);

    if (!token) {
      this.errorMessage = 'Aucun compte n\'est associé à cette adresse e-mail';
      this.isLoading = false;
      return;
    }

    // Afficher directement le lien de réinitialisation au lieu d'envoyer un email
    setTimeout(() => {
      this.isLoading = false;
      this.resetToken = token;
    }, 1000);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
