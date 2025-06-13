import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import type { Request } from '../../models/request.model';
import { RequestsService } from '../../services/requests.service';

@Component({
  selector: 'app-request-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './request-calendar.component.html',
  styleUrls: ['./request-calendar.component.scss']
})
export class RequestCalendarComponent implements OnInit, OnDestroy {
  // Demande sélectionnée pour affichage des détails
  selectedRequest: Request | null = null;
  showRequestDetails: boolean = false;
  
  // Données du calendrier
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  months: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Données des demandes
  requests: Request[] = []; // Demandes réelles uniquement
  requestsByDay: Map<number, Request[]> = new Map();
  filteredRequests: Request[] = []; // Demandes filtrées pour le mois actuel
  
  // Date actuelle pour le calendrier
  currentMonth: Date = new Date();
  daysInMonth: number[] = [];

  // Abonnement aux mises à jour des demandes
  private requestSubscription: Subscription | null = null;
  
  constructor(private requestsService: RequestsService) {}

  ngOnInit(): void {
    // Utiliser la date actuelle pour le calendrier
    this.currentMonth = new Date();
    console.log('Mois actuel pour le calendrier:', this.months[this.currentMonth.getMonth()], this.currentMonth.getFullYear());
    
    // Initialiser le calendrier pour le mois courant
    this.initializeCalendar();
    
    // Nettoyer le localStorage des données de test
    this.cleanupTestData();
    
    // Charger les demandes réelles depuis le service
    this.loadRealRequests();
    
    // S'abonner aux mises à jour des demandes
    this.requestSubscription = this.requestsService.requests$.subscribe(requests => {
      console.log('Nouvelles demandes reçues:', requests.length);
      this.requests = this.filterRealRequests(requests);
      this.filterRequestsForCurrentMonth();
      this.groupRequestsByDay();
    });
    
    // Forcer un rechargement périodique des demandes réelles toutes les 5 secondes
    // pour s'assurer que le calendrier est toujours synchronisé avec la page admin
    setInterval(() => {
      this.forceReloadRealRequests();
    }, 5000);
  }

  
  /**
   * Initialise le calendrier pour le mois courant
   */
  initializeCalendar(): void {
    // Déterminer le nombre de jours dans le mois actuel
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Créer un tableau avec tous les jours du mois
    this.daysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }
  
  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = null;
    }
  }
  
  /**
   * Charge les demandes réelles depuis le service RequestsService
   * Cette méthode supprime toutes les données de test et ne garde que les demandes réelles
   * Elle synchronise les demandes avec celles de la page admin
   */
  loadRealRequests(): void {
    // Forcer le rechargement depuis le localStorage pour avoir les données les plus récentes
    this.requestsService.reloadFromLocalStorage();
    
    // Récupérer toutes les demandes comme le ferait la page admin
    const allRequests = this.requestsService.getAllRequests();
    
    // Filtrer pour ne garder que les demandes réelles
    this.requests = this.filterRealRequests(allRequests);
    
    // Afficher les informations de débogage
    console.log('Demandes réelles chargées:', this.requests.length);
    if (this.requests.length > 0) {
      console.log('Exemples de demandes réelles:');
      this.requests.slice(0, 3).forEach(req => {
        console.log(`- ID: ${req.id}, Type: ${req.type}, Utilisateur: ${req.user?.firstName || req.user?.firstname || req.user_id || 'Inconnu'}, Dates: ${this.formatDate(req.start_date)} - ${this.formatDate(req.end_date)}`);
      });
    } else {
      console.warn('Aucune demande réelle trouvée. Vérifiez que des demandes ont été créées dans la page des demandes.');
    }
    
    // Filtrer et grouper les demandes
    this.filterRequestsForCurrentMonth();
    this.groupRequestsByDay();
  }
  
  /**
   * Force le rechargement des demandes réelles et nettoie complètement les données de test
   * Cette méthode est appelée périodiquement pour garantir la synchronisation avec la page admin
   */
  forceReloadRealRequests(): void {
    // Forcer le rechargement depuis le localStorage
    this.requestsService.reloadFromLocalStorage();
    
    // Récupérer toutes les demandes
    const allRequests = this.requestsService.getAllRequests();
    
    // Appliquer un filtrage strict pour éliminer toutes les données de test
    const realRequests = this.filterRealRequests(allRequests);
    
    // Vérifier si les demandes ont changé
    const currentRequestIds = this.requests.map(r => r.id).sort().join(',');
    const newRequestIds = realRequests.map(r => r.id).sort().join(',');
    
    if (currentRequestIds !== newRequestIds) {
      console.log('Mise à jour des demandes détectée, rechargement du calendrier...');
      this.requests = realRequests;
      this.filterRequestsForCurrentMonth();
      this.groupRequestsByDay();
    }
  }
  
  /**
   * Nettoie le localStorage des données de test (John, Jane, etc.)
   * Cette méthode supprime définitivement les données de test du localStorage
   */
  cleanupTestData(): void {
    console.log('Nettoyage des données de test du localStorage...');
    
    // Récupérer les demandes du localStorage
    const requestsKey = 'requests';
    const requestsJson = localStorage.getItem(requestsKey);
    
    if (requestsJson) {
      try {
        // Convertir les données JSON en tableau de demandes
        const allRequests: Request[] = JSON.parse(requestsJson);
        
        // Filtrer pour ne garder que les demandes réelles (suppression agressive des données de test)
        const realRequests = allRequests.filter(request => {
          // Supprimer toutes les demandes avec John ou Jane
          const firstName = (request.user?.firstName || request.user?.firstname || '').toLowerCase();
          if (firstName.includes('john') || firstName.includes('jane')) {
            return false;
          }
          
          // Supprimer les demandes avec des types spécifiques de test
          const typeLower = (request.type || '').toLowerCase();
          if (typeLower.includes('test') || typeLower.includes('demo') || 
              typeLower.includes('formation john') || typeLower.includes('congé john')) {
            return false;
          }
          
          // Supprimer les demandes sans dates valides
          if (!request.start_date && !request.end_date && 
              (!request.details?.startDate || !request.details?.endDate)) {
            return false;
          }
          
          return true;
        });
        
        // Afficher les statistiques de nettoyage
        const removedCount = allRequests.length - realRequests.length;
        console.log(`${removedCount} demandes de test supprimées du localStorage`);
        
        // Sauvegarder les demandes réelles dans le localStorage, même s'il n'y a pas de changement
        localStorage.setItem(requestsKey, JSON.stringify(realRequests));
        console.log('LocalStorage nettoyé avec succès');
        
        // Recharger les demandes dans le service
        this.requestsService.reloadFromLocalStorage();
        
        // Forcer le rechargement des demandes dans le composant
        this.loadRealRequests();
      } catch (error) {
        console.error('Erreur lors du nettoyage du localStorage:', error);
      }
    }
  }
  
  /**
   * Filtre les demandes pour ne garder que les demandes réelles
   * @param requests Toutes les demandes à filtrer
   * @returns Les demandes réelles uniquement
   */
  filterRealRequests(requests: Request[]): Request[] {
    // Filtrer les demandes en utilisant la méthode isRealRequest
    return requests.filter(request => this.isRealRequest(request));
  }
  
  /**
   * Vérifie si une demande est réelle (non fictive)
   * Cette méthode est utilisée à la fois dans le TS et dans le template HTML
   * @param request La demande à vérifier
   * @returns true si la demande est réelle, false si c'est une demande de test
   */
  isRealRequest(request: Request): boolean {
    // Liste de mots-clés qui indiquent des données de test
    const testKeywords = ['test', 'demo', 'exemple', 'john', 'jane', 'doe', 'smith', 'formation john'];
    
    // Si la demande n'a pas d'ID, de type, ou d'utilisateur, c'est probablement un test
    if (!request.id || !request.type || (!request.user_id && !request.user)) {
      return false;
    }
    
    // Si la demande n'a pas de dates valides, c'est probablement un test
    if (!request.start_date || !request.end_date) {
      return false;
    }
    
    // Vérifier l'ID de la demande
    const idLower = request.id.toLowerCase();
    if (testKeywords.some(keyword => idLower.includes(keyword))) {
      return false;
    }
    
    // Vérifier le type de demande
    const typeLower = request.type.toLowerCase();
    if (testKeywords.some(keyword => typeLower.includes(keyword))) {
      return false;
    }
    
    // Vérifier le nom de l'utilisateur (vérification stricte pour John et Jane)
    const firstName = (request.user?.firstName || request.user?.firstname || '').toLowerCase();
    if (firstName === 'john' || firstName === 'jane' || 
        firstName.includes('john') || firstName.includes('jane')) {
      return false;
    }
    
    // Vérifier le nom de famille de l'utilisateur
    const lastName = (request.user?.lastName || request.user?.lastname || '').toLowerCase();
    if (testKeywords.some(keyword => lastName.includes(keyword))) {
      return false;
    }
    
    // Vérification supplémentaire pour les demandes de congé ou formation de John
    if ((typeLower.includes('congé') || typeLower.includes('formation')) && 
        firstName.includes('john')) {
      return false;
    }
    
    // Si la demande passe tous les filtres, c'est une vraie demande
    return true;
  }
  
  /**
   * Fonction pour obtenir une date pour un jour spécifique du mois courant
   * @param day Le jour du mois
   * @returns Une date correspondant au jour spécifié dans le mois courant
   */
  private getDateForDay(day: number): Date {
    const date = new Date(this.currentMonth);
    date.setDate(day);
    return date;
  }
  
  /**
   * Filtre les demandes pour le mois actuel
   */
  filterRequestsForCurrentMonth(): void {
    // Filtrer les demandes pour le mois actuel
    const currentYear = this.currentMonth.getFullYear();
    const currentMonthIndex = this.currentMonth.getMonth();
    const monthStart = new Date(currentYear, currentMonthIndex, 1);
    const monthEnd = new Date(currentYear, currentMonthIndex + 1, 0);
    
    this.filteredRequests = this.requests.filter(request => {
      // Vérifier si la demande a des dates de début et de fin
      if (request.start_date && request.end_date) {
        try {
          // Convertir les dates en objets Date
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          
          // Vérifier si les dates chevauchent le mois actuel
          return startDate <= monthEnd && endDate >= monthStart;
        } catch (error) {
          console.error(`Erreur lors du traitement des dates de la demande ${request.id}:`, error);
          return false;
        }
      } else if (request.date) {
        try {
          // Pour les demandes sans date de début/fin, utiliser la date de la demande
          const requestDate = new Date(request.date);
          return requestDate.getMonth() === currentMonthIndex && requestDate.getFullYear() === currentYear;
        } catch (error) {
          console.error(`Erreur lors du traitement de la date de la demande ${request.id}:`, error);
          return false;
        }
      }
      return false;
    });
    
    // Afficher les informations de débogage
    console.log(`Affichage de ${this.filteredRequests.length} demandes pour ${this.getCurrentMonthName()}`);
    
    // Afficher les détails des demandes pour le débogage
    this.filteredRequests.forEach(request => {
      console.log(`Demande: ${request.id}, Type: ${request.type}, Employé: ${request.user?.firstName || request.user?.firstname || 'Inconnu'}, Dates: ${request.start_date} - ${request.end_date}`);
    });
  }
  
  /**
   * Groupe les demandes par jour pour l'affichage dans le calendrier
   */
  groupRequestsByDay(): void {
    // Réinitialiser la map
    this.requestsByDay = new Map();
    
    // Obtenir l'année et le mois actuels pour le calendrier
    const currentYear = this.currentMonth.getFullYear();
    const currentMonthIndex = this.currentMonth.getMonth();
    
    console.log(`Groupement des demandes pour ${this.months[currentMonthIndex]} ${currentYear}`);
    console.log(`Nombre total de demandes à traiter: ${this.filteredRequests.length}`);
    
    // Grouper les demandes par jour
    this.filteredRequests.forEach(request => {
      // Vérifier si la demande a des dates de début et de fin
      if (request.start_date && request.end_date) {
        try {
          // Convertir les dates en objets Date
          const startDate = new Date(request.start_date);
          const endDate = new Date(request.end_date);
          
          console.log(`Traitement de la demande ${request.id}: ${request.type} du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`);
          
          // Vérifier si les dates chevauchent le mois actuel
          const monthStart = new Date(currentYear, currentMonthIndex, 1);
          const monthEnd = new Date(currentYear, currentMonthIndex + 1, 0);
          
          // Si la période de la demande chevauche le mois actuel
          if (startDate <= monthEnd && endDate >= monthStart) {
            // Déterminer la date de début effective pour ce mois
            const effectiveStart = startDate < monthStart ? monthStart : startDate;
            // Déterminer la date de fin effective pour ce mois
            const effectiveEnd = endDate > monthEnd ? monthEnd : endDate;
            
            // Ajouter la demande à chaque jour de la période
            const oneDay = 24 * 60 * 60 * 1000; // millisecondes dans une journée
            for (let time = effectiveStart.getTime(); time <= effectiveEnd.getTime(); time += oneDay) {
              const d = new Date(time);
              if (d.getMonth() === currentMonthIndex) {
                const day = d.getDate();
                if (!this.requestsByDay.has(day)) {
                  this.requestsByDay.set(day, []);
                }
                
                // Vérifier si la demande n'est pas déjà présente pour ce jour
                const existingRequests = this.requestsByDay.get(day) || [];
                if (!existingRequests.some(r => r.id === request.id)) {
                  this.requestsByDay.get(day)?.push(request);
                  console.log(`Ajout de la demande ${request.id} (${request.type}) au jour ${day}`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors du traitement de la demande ${request.id}:`, error);
        }
      } else if (request.date) {
        // Pour les demandes sans date de début/fin, utiliser la date de la demande
        try {
          const requestDate = new Date(request.date);
          
          // Vérifier si la date est dans le mois actuel
          if (requestDate.getMonth() === currentMonthIndex && requestDate.getFullYear() === currentYear) {
            const day = requestDate.getDate();
            
            if (!this.requestsByDay.has(day)) {
              this.requestsByDay.set(day, []);
            }
            
            // Vérifier si la demande n'est pas déjà présente pour ce jour
            const existingRequests = this.requestsByDay.get(day) || [];
            if (!existingRequests.some(r => r.id === request.id)) {
              this.requestsByDay.get(day)?.push(request);
              console.log(`Ajout de la demande ${request.id} (${request.type}) au jour ${day} (date unique)`);
            }
          }
        } catch (error) {
          console.error(`Erreur lors du traitement de la date de la demande ${request.id}:`, error);
        }
      }
    });
    
    // Afficher les jours avec des demandes pour débogage
    console.log('Jours avec des demandes:');
    this.requestsByDay.forEach((requests, day) => {
      console.log(`Jour ${day}: ${requests.length} demandes`);
      requests.forEach(req => console.log(`  - ${req.id}: ${req.type} (${req.user?.firstName || req.user?.firstname || 'Inconnu'})`));
    });
  }
  
  /**
   * Récupère les demandes pour un jour spécifique
   * @param day Le jour du mois
   * @returns La liste des demandes pour ce jour
   */
  getRequestsForDay(day: number): Request[] {
    return this.requestsByDay.get(day) || [];
  }
  
  /**
   * Change le mois affiché dans le calendrier
   * @param increment Nombre de mois à ajouter (positif) ou soustraire (négatif)
   */
  changeMonth(increment: number): void {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(this.currentMonth.getMonth() + increment);
    this.currentMonth = newMonth;

    this.initializeCalendar();
    this.filterRequestsForCurrentMonth();
    this.groupRequestsByDay();
  }
  
  /**
   * Retourne le nom du mois courant avec l'année
   * @returns Le nom du mois et l'année (ex: "Mai 2025")
   */
  getCurrentMonthName(): string {
    return this.months[this.currentMonth.getMonth()] + ' ' + this.currentMonth.getFullYear();
  }

  /**
   * Retourne la classe CSS en fonction du statut de la demande
   * @param status Le statut de la demande
   * @returns La classe CSS correspondante
   */
  getStatusClass(status: string): string {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('approuv') || statusLower === 'approved') {
      return 'status-approved'; // Vert
    } else if (statusLower.includes('rejet') || statusLower === 'rejected' || statusLower === 'rejetée') {
      return 'status-rejected'; // Rouge
    } else if (statusLower.includes('chef approuvé')) {
      return 'status-chef-approved'; // Jaune
    } else if (statusLower.includes('chef rejeté')) {
      return 'status-chef-rejected'; // Orange
    } else {
      return 'status-pending'; // Bleu
    }
  }
  
  /**
   * Affiche les détails d'une demande
   * @param request La demande à afficher
   */
  viewRequestDetails(request: Request): void {
    this.selectedRequest = request;
    this.showRequestDetails = true;
  }
  
  /**
   * Ferme la fenêtre de détails
   */
  closeRequestDetails(): void {
    this.selectedRequest = null;
    this.showRequestDetails = false;
  }
  
  /**
   * Formate une date pour l'affichage
   * @param date La date à formater
   * @returns La date formatée
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Non spécifiée';
    
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
