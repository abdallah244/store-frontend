import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, NavigationStart, NavigationEnd, Router } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AdminNavbarComponent } from './admin/admin-navbar/admin-navbar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    AdminNavbarComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly progress = signal(0);
  protected readonly showPageLoading = signal(false);

  private pageLoadingTimeout: any;
  private navSubscription: any;

  constructor(private router: Router) {}

  ngOnInit() {
    // Show loading bar when navigation starts
    this.navSubscription = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        this.showPageLoading.set(true);
        this.progress.set(10);

        // Simulate progress
        const progressInterval = setInterval(() => {
          this.progress.update((p) => {
            if (p < 90) return p + Math.random() * 30;
            clearInterval(progressInterval);
            return p;
          });
        }, 200);
      } else if (event instanceof NavigationEnd) {
        this.progress.set(100);

        // Hide loading bar after brief delay
        this.pageLoadingTimeout = setTimeout(() => {
          this.showPageLoading.set(false);
          this.progress.set(0);
        }, 300);
      }
    });
  }

  ngOnDestroy() {
    if (this.pageLoadingTimeout) {
      clearTimeout(this.pageLoadingTimeout);
    }
    if (this.navSubscription) {
      this.navSubscription.unsubscribe();
    }
  }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
