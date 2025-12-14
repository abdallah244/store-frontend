import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if admin token exists
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      return true;
    } else {
      // Redirect to admin login
      this.router.navigate(['/admin/login']);
      return false;
    }
  }
}
