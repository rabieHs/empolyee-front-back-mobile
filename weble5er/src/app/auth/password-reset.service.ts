import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

interface TokenData {
  email: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private readonly TOKEN_VALIDITY_DURATION = 3600000; // 1 heure en millisecondes
  private readonly STORAGE_KEY = 'password_reset_tokens';

  constructor(private authService: AuthService) {}

  generateResetToken(email: string): string | null {
    // Vérifier si l'email existe dans la base de données
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.some((user: any) => user.email === email);

    if (!userExists) {
      return null;
    }

    // Générer un token unique
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Récupérer les tokens existants
    const tokensJson = localStorage.getItem(this.STORAGE_KEY);
    const tokens: Record<string, TokenData> = tokensJson ? JSON.parse(tokensJson) : {};
    
    // Sauvegarder le token avec l'email et le timestamp
    tokens[token] = {
      email,
      timestamp: Date.now()
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));

    return token;
  }

  validateResetToken(token: string): boolean {
    // Récupérer les tokens depuis localStorage
    const tokensJson = localStorage.getItem(this.STORAGE_KEY);
    if (!tokensJson) return false;
    
    const tokens: Record<string, TokenData> = JSON.parse(tokensJson);
    const tokenData = tokens[token];
    
    if (!tokenData) {
      return false;
    }

    // Vérifier si le token n'a pas expiré
    const isValid = (Date.now() - tokenData.timestamp) < this.TOKEN_VALIDITY_DURATION;
    
    if (!isValid) {
      // Supprimer le token expiré
      delete tokens[token];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
    }

    return isValid;
  }

  resetPassword(token: string, newPassword: string): boolean {
    // Vérifier la validité du token
    if (!this.validateResetToken(token)) {
      return false;
    }
    
    // Récupérer les tokens depuis localStorage
    const tokensJson = localStorage.getItem(this.STORAGE_KEY);
    if (!tokensJson) return false;
    
    const tokens: Record<string, TokenData> = JSON.parse(tokensJson);
    const tokenData = tokens[token];
    
    if (!tokenData) {
      return false;
    }

    // Récupérer les utilisateurs
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((user: any) => user.email === tokenData.email);

    if (userIndex === -1) {
      return false;
    }

    // Mettre à jour le mot de passe
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));

    // Supprimer le token utilisé
    delete tokens[token];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));

    return true;
  }

  // Simuler l'envoi d'email (dans un environnement de production, utilisez un vrai service d'email)
  sendResetEmail(email: string, token: string): void {
    console.log(`
      Email de réinitialisation envoyé à ${email}
      Lien de réinitialisation : http://localhost:4200/reset-password/${token}
      (Ce message est une simulation, dans un environnement de production, un vrai email serait envoyé)
    `);
  }
}
