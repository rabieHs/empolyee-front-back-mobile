import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';

export interface TrainingTheme {
  id: string;
  name: string;
  topics: string[];
}

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-training-request',
  templateUrl: './training-request.component.html',
  styleUrls: ['./training-request.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TrainingRequestComponent implements OnInit {
  departments = [
    { 
      id: 'dev',
      name: 'Développement',
      themes: [
        {
          id: 'web',
          name: 'Développement Web',
          topics: ['Angular', 'React', 'Vue.js', 'Node.js', 'PHP', 'Django']
        },
        {
          id: 'mobile',
          name: 'Développement Mobile',
          topics: ['React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)']
        },
        {
          id: 'backend',
          name: 'Backend & API',
          topics: ['Spring Boot', 'Express.js', 'ASP.NET Core', 'GraphQL']
        },
        {
          id: 'devops',
          name: 'DevOps & Cloud',
          topics: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD']
        },
        {
          id: 'data',
          name: 'Data & BI',
          topics: ['SQL', 'NoSQL', 'Power BI', 'Tableau', 'Big Data']
        }
      ]
    }
  ];

  selectedDepartment: string = '';
  selectedTheme: string = '';
  selectedTopic: string = '';
  availableThemes: TrainingTheme[] = [];
  availableTopics: string[] = [];
  requestId: string | null = null;
  request = {
    title: '',
    organization: '',
    startDate: '',
    endDate: '',
    trainingType: '',
    objectives: '',
    cost: 0,
    documents: [] as File[]
  };

  trainingTypes = [
    'Formation technique',
    'Formation managériale',
    'Formation linguistique',
    'Autre'
  ];

  editMode = false;
  isSubmitting = false;
  submitSuccess: string | null = null;
  submitError: string | null = null;

  @ViewChild('trainingForm') trainingForm!: NgForm;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private requestsService: RequestsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.requestId = id;
      const numericId = parseInt(id, 10);
      const existingRequest = this.requestsService.getRequestById(numericId);
      
      if (existingRequest && existingRequest.details) {
        const details = typeof existingRequest.details === 'string' 
          ? JSON.parse(existingRequest.details) 
          : existingRequest.details;
          
        this.request = {
          title: details.title || '',
          organization: details.organization || '',
          startDate: details.startDate || '',
          endDate: details.endDate || '',
          trainingType: details.trainingType || '',
          objectives: details.objectives || '',
          cost: details.cost || 0,
          documents: []
        };
        
        if (details.department) {
          this.selectedDepartment = details.department;
          this.onDepartmentChange();
          if (details.theme) {
            this.selectedTheme = details.theme;
            this.onThemeChange();
            if (details.topic) {
              this.selectedTopic = details.topic;
            }
          }
        }
      }
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.request.documents = Array.from(files);
    }
  }

  onDepartmentChange() {
    const department = this.departments.find(d => d.id === this.selectedDepartment);
    if (department) {
      this.availableThemes = department.themes;
      this.selectedTheme = '';
      this.selectedTopic = '';
      this.availableTopics = [];
    }
  }

  onThemeChange() {
    const theme = this.availableThemes.find(t => t.id === this.selectedTheme);
    if (theme) {
      this.availableTopics = theme.topics;
      this.selectedTopic = '';
    }
  }

  onSubmit() {
    if (!this.trainingForm.valid) return;
    
    this.isSubmitting = true;
    this.submitError = null;
    this.submitSuccess = null;

    const trainingRequestData = {
      title: this.request.title,
      organization: this.request.organization,
      startDate: this.request.startDate,
      endDate: this.request.endDate,
      trainingType: this.request.trainingType,
      objectives: this.request.objectives,
      cost: this.request.cost,
      department: this.selectedDepartment,
      theme: this.selectedTheme,
      topic: this.selectedTopic
    };

    try {
      if (this.editMode && this.requestId) {
        const numericId = parseInt(this.requestId, 10);
        this.requestsService.updateTrainingRequest(numericId, trainingRequestData);
        this.submitSuccess = "Demande de formation mise à jour avec succès.";
      } else {
        // Construction de l'objet Request pour addRequest
        const newRequest = {
          type: "Formation",
          status: 'En attente',
          date: new Date().toISOString().split('T')[0],
          description: `Formation: ${this.request.title}`,
          details: trainingRequestData
        };
        
        this.requestsService.addRequest(newRequest);
        this.submitSuccess = "Demande de formation envoyée avec succès.";
      }
      
      setTimeout(() => {
        this.router.navigate(['/home/requests']);
      }, 1500);
    } catch (error) {
      this.submitError = "Une erreur s'est produite lors de l'enregistrement de la demande.";
      console.error('Erreur lors de la soumission de la demande de formation:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/home/requests']);
  }
}
