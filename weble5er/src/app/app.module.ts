import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RequestFormComponent } from './home/requests/request-form/request-form.component';
import { EditRequestComponent } from './requests/edit-request/edit-request.component';
import { RequestDetailsComponent } from './home/requests/request-details/request-details.component';
import { AdminRequestsCalendarComponent } from './admin/admin-requests-calendar/admin-requests-calendar.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';

// Configuration de Socket.IO
const socketIoConfig: SocketIoConfig = { 
  url: 'http://localhost:3000', 
  options: {
    autoConnect: true,
    reconnection: true
  } 
};

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    RequestFormComponent,
    EditRequestComponent,
    RequestDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    SocketIoModule.forRoot(socketIoConfig),
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    MatIconModule,
    SharedModule
  ],
  providers: [
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
