import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PageTransitionService {
  pageEntering$ = new BehaviorSubject<boolean>(false);
  constructor(private router: Router) {
    this.initializeTransitions();
  }

  private initializeTransitions() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.pageEntering$.next(true);
      setTimeout(() => this.pageEntering$.next(false), 50);
    });
  }

  navigateWithTransition(path: string) {
    this.pageEntering$.next(false);
    setTimeout(() => {
      this.router.navigate([path]);
    }, 200);
  }
}
