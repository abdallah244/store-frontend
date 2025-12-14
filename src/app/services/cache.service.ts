import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, any>();
  private requestCache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    // Check memory cache first
    if (this.cache.has(url)) {
      return of(this.cache.get(url)! as T);
    }

    // Check if request is already in progress
    if (this.requestCache.has(url)) {
      return this.requestCache.get(url)! as Observable<T>;
    }

    // Make request and cache it
    const request$ = this.http.get<T>(url).pipe(
      tap((response) => this.cache.set(url, response)),
      shareReplay(1)
    );

    this.requestCache.set(url, request$);
    return request$;
  }

  post<T>(url: string, body: any): Observable<T> {
    // Don't cache POST requests
    return this.http.post<T>(url, body);
  }

  invalidate(url: string): void {
    this.cache.delete(url);
    this.requestCache.delete(url);
  }

  clear(): void {
    this.cache.clear();
    this.requestCache.clear();
  }
}
