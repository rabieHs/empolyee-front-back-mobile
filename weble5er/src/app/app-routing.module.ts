import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './home/dashboard/dashboard.component';
import { WelcomeComponent } from './home/welcome/welcome.component';
import { RequestFormComponent } from './home/requests/request-form/request-form.component';
import { WorkCertificateRequestComponent } from './home/requests/work-certificate-request/work-certificate-request.component'; // Chemin mis à jour
import { RequestEditComponent } from './home/requests/request-edit/request-edit.component';
import { RequestDetailsComponent } from './home/requests/request-details/request-details.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminComponent } from './admin/admin.component';
import { SimpleAdminComponent } from './admin/simple-admin/simple-admin.component';
import { BasicAdminComponent } from './admin/basic-admin/basic-admin.component';
import { TestPageComponent } from './test-page/test-page.component';
import { MinimalComponent } from './minimal/minimal.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './home/profile/profile.component';
import { RequestsComponent } from './home/requests/requests.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { LeaveRequestComponent } from './home/requests/leave-request/leave-request.component';
import { TrainingRequestComponent } from './home/requests/training-request/training-request.component';
import { LoanRequestComponent } from './home/requests/loan-request/loan-request.component';
import { AdvanceRequestComponent } from './home/requests/advance-request/advance-request.component';
import { DocumentRequestComponent } from './home/requests/document-request/document-request.component';
import { ChefViewComponent } from './chef/chef-view.component';
import { ChefDashboardComponent } from './chef/chef-dashboard.component';
import { SimpleCalendarComponent } from './admin/simple-calendar/simple-calendar.component';
import { DirectCalendarComponent } from './admin/direct-calendar/direct-calendar.component';
import { RequestCalendarComponent } from './admin/request-calendar/request-calendar.component';
import { AdminRequestsCalendarComponent } from './admin/admin-requests-calendar/admin-requests-calendar.component';

const routes: Routes = [
  { path: '', component: MinimalComponent },
  { path: 'minimal', component: MinimalComponent },
  { path: 'test', component: TestPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'chef',
    component: ChefViewComponent,
    canActivate: [AuthGuard],
    data: { roles: ['chef'] }
  },
  {
    path: 'admin',
    component: BasicAdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin-test',
    component: BasicAdminComponent
  },
  {
    path: 'admin/calendar',
    component: SimpleCalendarComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/direct-calendar',
    component: DirectCalendarComponent
  },
  {
    path: 'admin/request-calendar',
    component: RequestCalendarComponent
  },
  {
    path: 'admin/requests-calendar',
    component: AdminRequestsCalendarComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: WelcomeComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/:id', component: ProfileComponent },
      { path: 'requests', component: RequestsComponent },
      // Retirer la route pour la création d'une nouvelle demande
      // { path: 'requests/new', component: RequestFormComponent },
      { path: 'requests/:id', component: RequestDetailsComponent }, // Affiche la page de détails
      { path: 'requests/leave/edit/:id', component: LeaveRequestComponent },
      { path: 'requests/training/edit/:id', component: TrainingRequestComponent },
      { path: 'requests/certificate/edit/:id', component: WorkCertificateRequestComponent }, // Si nécessaire
      { path: 'requests/loan/edit/:id', component: LoanRequestComponent },
      { path: 'requests/advance/edit/:id', component: AdvanceRequestComponent },
      { path: 'requests/document/edit/:id', component: DocumentRequestComponent }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }