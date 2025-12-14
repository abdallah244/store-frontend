import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName: string = '';
  userAvatarUrl: string = '';
  isMobileMenuOpen = false;
  brandName: string = 'LOCAL CRAFT';
  brandTagline: string = 'Premium Selection';
  brandLogoUrl: string = '';
  private storageListener: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef, public cart: CartService, private http: HttpClient) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadCurrentUserFromBackend();
    // Load brand strictly from backend (no localStorage) so it persists and doesn't revert on refresh
    this.loadBrandSettingsFromBackend();
    // Listen to storage changes (login/logout + brand updates)
    const handler = () => {
      this.checkLoginStatus();
      // Re-fetch user to avoid stale name/avatar after profile edits
      this.loadCurrentUserFromBackend();
    };
    window.addEventListener('storage', handler);
    this.storageListener = handler;

    // Listen to custom brand update events from Admin Dashboard
    window.addEventListener('brand-updated', () => {
      // Admin dashboard broadcasts after saving; re-fetch from backend only
      this.loadBrandSettingsFromBackend();
    });

    window.addEventListener('user-updated', () => {
      this.loadCurrentUserFromBackend();
    });
  }

  ngOnDestroy() {
    if (this.storageListener) window.removeEventListener('storage', this.storageListener);
  }

  private loadBrandSettingsFromBackend() {
    this.http.get<any>('http://localhost:3000/api/brand/settings').subscribe({
      next: (data) => {
        if (data?.name) this.brandName = data.name;
        if (data?.tagline) this.brandTagline = data.tagline;
        if (data?.logoUrl) this.brandLogoUrl = this.normalizeLogoUrl(data.logoUrl, /*bust*/ true);
        this.cdr.markForCheck();
      },
      error: () => {
        // Keep local values if backend is unreachable
        this.cdr.markForCheck();
      },
    });
  }

  private normalizeLogoUrl(url: string, bust = false): string {
    if (!url) return '';
    let base = url;
    if (!(url.startsWith('http://') || url.startsWith('https://'))) {
      if (url.startsWith('/uploads')) base = `http://localhost:3000${url}`;
    }
    if (bust) {
      const v = Date.now();
      return `${base}?v=${v}`;
    }
    return base;
  }

  private normalizeAvatarUrl(url: string): string {
    if (!url) return '';
    const base = this.normalizeLogoUrl(url);
    // Cache-bust avatar so updates reflect immediately
    const v = Date.now();
    return base ? `${base}?v=${v}` : '';
  }

  private checkLoginStatus() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.isLoggedIn = true;
      // Do not trust localStorage for important data like name/avatar
    } else {
      this.isLoggedIn = false;
      this.userName = '';
      this.userAvatarUrl = '';
    }
    this.cdr.markForCheck();
  }

  private loadCurrentUserFromBackend() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    this.http.get<any>(`http://localhost:3000/api/auth/user/${userId}`).subscribe({
      next: (resp) => {
        const user = resp?.user;
        if (!user) return;
        this.userName = user.name || '';
        if (user.profileImage) {
          this.userAvatarUrl = this.normalizeAvatarUrl(user.profileImage);
        } else {
          this.userAvatarUrl = '';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Keep prior UI; avoid localStorage for critical fields
        this.cdr.markForCheck();
      },
    });
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    this.checkLoginStatus();
    this.isMobileMenuOpen = false;
    // Reload page or navigate
    window.location.href = '/home';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}
