import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check for role-based access
    if (route.data['roles']) {
      const requiredRoles = route.data['roles'] as string[];
      if (!requiredRoles.includes(currentUser.role)) {
        // Redirect based on user role
        switch (currentUser.role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'chef':
            this.router.navigate(['/chef']);
            break;
          case 'user':
          default:
            this.router.navigate(['/home']);
            break;
        }
        return false;
      }
    }

    return true;
  }
}
