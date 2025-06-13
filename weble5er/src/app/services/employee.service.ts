import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export interface Employee {
  id: string;
  salary: number;
  name: string;
  position: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  // Simulation des données employés (à remplacer par une vraie API)
  private _employees: Employee[] = [
    { id: '1', salary: 3000, name: 'Mohamed Alaoui', position: 'Développeur' },
    { id: '2', salary: 4000, name: 'Fatima Zahra', position: 'Chef de projet' },
    { id: '3', salary: 3500, name: 'Youssef Benali', position: 'Designer' },
    { id: '4', salary: 3200, name: 'Marie Dupont', position: 'Analyste' },
    { id: '5', salary: 3800, name: 'Ahmed Bensaid', position: 'Ingénieur' },
    { id: '6', salary: 2900, name: 'Sophie Martin', position: 'Assistante' },
    { id: '7', salary: 4200, name: 'Thomas Leroy', position: 'Architecte' }
  ];
  
  // Méthode publique pour accéder aux données des employés
  getAllEmployees(): Employee[] {
    return this._employees;
  }

  constructor(private authService: AuthService) {}

  getCurrentEmployee(): Employee | null {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return null;
    
    return this._employees.find(e => e.id === currentUser.id) || null;
  }

  getCurrentEmployeeSalary(): number {
    const employee = this.getCurrentEmployee();
    return employee ? employee.salary : 0;
  }

  getMaximumLoanInfo(): { monthlySalary: number; loanCap: number } {
    const salary = this.getCurrentEmployeeSalary();
    
    return {
      monthlySalary: salary,
      loanCap: Number.MAX_SAFE_INTEGER // Pas de limite sur le montant du prêt
    };
  }
}
