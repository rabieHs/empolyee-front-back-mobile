import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RequestsComponent } from './home/requests/requests.component';
import { ProfileComponent } from './home/profile/profile.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { WelcomeComponent } from './home/welcome/welcome.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { NewRequestComponent } from './home/requests/new-request/new-request.component';
import { LeaveRequestComponent } from './home/requests/leave-request/leave-request.component';
import { TrainingRequestComponent } from './home/requests/training-request/training-request.component';
import { WorkCertificateRequestComponent } from './home/requests/work-certificate-request/work-certificate-request.component';
import { RequestDetailsComponent } from './home/requests/request-details/request-details.component';
import { LoanRequestComponent } from './home/requests/loan-request/loan-request.component';
import { AdvanceRequestComponent } from './home/requests/advance-request/advance-request.component';
import { DocumentRequestComponent } from './home/requests/document-request/document-request.component';
import { AuthGuard } from './auth/auth.guard';
import { AdminComponent } from './admin/admin.component';
import { MinimalComponent } from './minimal/minimal.component';
import { SimpleAdminComponent } from './admin/simple-admin/simple-admin.component';
import { BasicAdminComponent } from './admin/basic-admin/basic-admin.component';
// Importation des composants de calendrier
import { AdminCalendarComponent } from './admin/admin-calendar/admin-calendar.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminProfileComponent } from './admin/admin-profile/admin-profile.component';
import { ChefCalendarComponent } from './chef/chef-calendar/chef-calendar.component';
import { RequestCalendarComponent } from './admin/request-calendar/request-calendar.component';

// Importation des composants de calendrier existants
import { MonthlyCalendarComponent } from './monthly-calendar/monthly-calendar.component';
import { BasicCalendarComponent } from './basic-calendar/basic-calendar.component';
import { GridCalendarComponent } from './grid-calendar/grid-calendar.component';
import { SimpleGridCalendarComponent } from './simple-grid-calendar/simple-grid-calendar.component';
import { SyncedCalendarComponent } from './synced-calendar/synced-calendar.component';
import { FinalCalendarComponent } from './final-calendar/final-calendar.component';
import { EmployeeGridCalendarComponent } from './employee-grid-calendar/employee-grid-calendar.component';
import { UltraSimpleCalendarComponent } from './ultra-simple-calendar/ultra-simple-calendar.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'minimal', component: MinimalComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'demandes', loadComponent: () => import('./admin/admin-demandes/admin-demandes.component').then(m => m.AdminDemandesComponent) },
      { path: 'profile', component: AdminProfileComponent },
      { path: 'administration', loadComponent: () => import('./admin/admin-administration/admin-administration.component').then(m => m.AdminAdministrationComponent) }
    ]
  },
  { path: 'admin/calendar', component: AdminCalendarComponent, canActivate: [AuthGuard] },
  {
    path: 'chef',
    loadComponent: () => import('./chef/chef.component').then(m => m.ChefComponent),
    canActivate: [AuthGuard],
    data: { roles: ['chef'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./chef/chef-dashboard-new/chef-dashboard-new.component').then(m => m.ChefDashboardNewComponent) },
      { path: 'demandes', loadComponent: () => import('./chef/chef-demandes/chef-demandes.component').then(m => m.ChefDemandesComponent) },
      { path: 'profile', loadComponent: () => import('./chef/chef-profile/chef-profile.component').then(m => m.ChefProfileComponent) },
      { path: 'administration', loadComponent: () => import('./chef/chef-administration/chef-administration.component').then(m => m.ChefAdministrationComponent) }
    ]
  },
  { path: 'chef-old', component: ChefCalendarComponent, canActivate: [AuthGuard] },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: WelcomeComponent },
      { path: 'requests', component: RequestsComponent },
      { path: 'requests/new', component: NewRequestComponent },
      { path: 'requests/leave', component: LeaveRequestComponent },
      { path: 'requests/leave/edit/:id', component: LeaveRequestComponent },
      { path: 'requests/training', component: TrainingRequestComponent },
      { path: 'requests/training/edit/:id', component: TrainingRequestComponent },
      { path: 'requests/certificate', component: WorkCertificateRequestComponent },
      { path: 'requests/certificate/edit/:id', component: WorkCertificateRequestComponent },
      { path: 'requests/loan', component: LoanRequestComponent },
      { path: 'requests/loan/edit/:id', component: LoanRequestComponent },
      { path: 'requests/advance', component: AdvanceRequestComponent },
      { path: 'requests/advance/edit/:id', component: AdvanceRequestComponent },
      { path: 'requests/document', component: DocumentRequestComponent },
      { path: 'requests/document/edit/:id', component: DocumentRequestComponent },
      { path: 'requests/:id', component: RequestDetailsComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  }
];
