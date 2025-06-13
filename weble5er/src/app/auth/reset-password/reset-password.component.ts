import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reset-password-container">
      <div class="form-box">
        <h2>Réinitialisation du mot de passe</h2>
        <p class="instruction">Veuillez entrer votre nouveau mot de passe</p>
        
        <form (ngSubmit)="onSubmit()" *ngIf="!tokenInvalid">
          <div class="input-box">
            <input 
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="password" 
              name="password" 
              placeholder="Nouveau mot de passe"
              required>
            <i class='bx bxs-lock'></i>
          </div>

          <div class="input-box">
            <input 
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="confirmPassword" 
              name="confirmPassword" 
              placeholder="Confirmer le mot de passe"
              required>
            <i class='bx bxs-lock'></i>
          </div>

          <div class="show-password">
            <input type="checkbox" id="showPassword" [(ngModel)]="showPassword" name="showPassword">
            <label for="showPassword">Afficher le mot de passe</label>
          </div>

          <div class="password-strength" *ngIf="password">
            <div class="strength-meter">
              <div class="strength-bar" [ngStyle]="{'width': getPasswordStrength() + '%', 'background-color': getPasswordStrengthColor()}"></div>
            </div>
            <span class="strength-text" [ngStyle]="{'color': getPasswordStrengthColor()}">{{ getPasswordStrengthText() }}</span>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn" [disabled]="isLoading || !isPasswordValid()">
            <span *ngIf="!isLoading">Réinitialiser le mot de passe</span>
            <span *ngIf="isLoading">Réinitialisation en cours...</span>
          </button>
        </form>

        <div class="error-box" *ngIf="tokenInvalid">
          <i class='bx bx-error-circle'></i>
          <h3>Lien invalide ou expiré</h3>
          <p>Le lien de réinitialisation du mot de passe est invalide ou a expiré.</p>
          <button class="btn" (click)="backToForgotPassword()">Demander un nouveau lien</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
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

    .error-box {
      text-align: center;
      color: #dc3545;

      i {
        font-size: 48px;
        margin-bottom: 15px;
      }

      h3 {
        margin-bottom: 10px;
      }

      p {
        margin-bottom: 20px;
        color: #666;
      }
    }

    .show-password {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      
      input[type="checkbox"] {
        width: auto;
        margin: 0;
      }
      
      label {
        color: #666;
        font-size: 14px;
        cursor: pointer;
      }
    }
    
    .password-strength {
      margin-bottom: 20px;
      
      .strength-meter {
        height: 6px;
        background-color: #e9ecef;
        border-radius: 3px;
        margin-bottom: 5px;
      }
      
      .strength-bar {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease, background-color 0.3s ease;
      }
      
      .strength-text {
        font-size: 12px;
        text-align: right;
        display: block;
        font-weight: 500;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  tokenInvalid: boolean = false;
  showPassword: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token || !this.passwordResetService.validateResetToken(this.token)) {
      this.tokenInvalid = true;
    }
  }

  // Calculer la force du mot de passe (0-100)
  getPasswordStrength(): number {
    if (!this.password) return 0;
    
    let strength = 0;
    
    // Longueur (40%)
    if (this.password.length >= 8) strength += 20;
    if (this.password.length >= 10) strength += 10;
    if (this.password.length >= 12) strength += 10;
    
    // Complexité (60%)
    if (/[A-Z]/.test(this.password)) strength += 15; // Majuscules
    if (/[a-z]/.test(this.password)) strength += 15; // Minuscules
    if (/[0-9]/.test(this.password)) strength += 15; // Chiffres
    if (/[^A-Za-z0-9]/.test(this.password)) strength += 15; // Caractères spéciaux
    
    return strength;
  }
  
  // Obtenir la couleur en fonction de la force du mot de passe
  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    
    if (strength < 30) return '#dc3545'; // Rouge
    if (strength < 60) return '#ffc107'; // Jaune
    if (strength < 80) return '#17a2b8'; // Bleu
    return '#28a745'; // Vert
  }
  
  // Obtenir le texte descriptif de la force du mot de passe
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    
    if (strength < 30) return 'Très faible';
    if (strength < 60) return 'Faible';
    if (strength < 80) return 'Moyen';
    return 'Fort';
  }
  
  // Vérifier si le mot de passe est valide pour la soumission
  isPasswordValid(): boolean {
    if (!this.password || !this.confirmPassword) return false;
    if (this.password !== this.confirmPassword) return false;
    if (this.password.length < 6) return false;
    return true;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isLoading = true;

    if (this.passwordResetService.resetPassword(this.token, this.password)) {
      this.successMessage = 'Votre mot de passe a été réinitialisé avec succès';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.errorMessage = 'Une erreur est survenue lors de la réinitialisation du mot de passe';
    }

    this.isLoading = false;
  }

  backToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
