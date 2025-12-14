import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNavbarComponent implements OnInit, OnDestroy {
  adminEmail: string = '';
  currentTime: string = '';
  isMobileMenuOpen = false;
  private timeInterval: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.adminEmail = localStorage.getItem('adminEmail') || 'Admin';
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    this.router.navigate(['/admin/login']);
  }
}
