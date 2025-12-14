import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FavoriteProduct {
  _id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  discount?: number;
  isOnSale?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private favorites = new BehaviorSubject<FavoriteProduct[]>([]);
  public favorites$ = this.favorites.asObservable();
  private userId: string | null = null;
  private useDatabase: boolean = false;

  constructor(private http: HttpClient) {
    this.userId = this.getUserIdFromToken();
    this.useDatabase = !!this.userId;

    if (this.useDatabase) {
      this.loadFavoritesFromDatabase();
    } else {
      this.loadFavoritesFromStorage();
    }
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');

    if (userId) {
      return userId;
    }

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private loadFavoritesFromStorage(): FavoriteProduct[] {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('favorites');
      const favorites = stored ? JSON.parse(stored) : [];
      this.favorites.next(favorites);
      return favorites;
    }
    return [];
  }

  private saveFavoritesToStorage(favorites: FavoriteProduct[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }

  private loadFavoritesFromDatabase(): void {
    if (!this.userId) return;

    this.http.get<any[]>(`${this.apiUrl}/admin/favorites/${this.userId}`).subscribe({
      next: (data) => {
        const favorites = data.map((fav: any) => ({
          _id: fav.productId._id,
          name: fav.productId.name,
          price: fav.productId.price,
          image: fav.productId.image,
          category: fav.productId.category,
          discount: fav.productId.discount,
          isOnSale: fav.productId.isOnSale,
        }));
        this.favorites.next(favorites);
      },
      error: (err) => {
        console.error('Error loading favorites from database:', err);
        this.favorites.next([]);
      },
    });
  }

  addFavorite(product: FavoriteProduct): void {
    const current = this.favorites.value;
    const exists = current.some((p) => p._id === product._id);

    if (exists) {
      return;
    }

    if (this.useDatabase && this.userId) {
      this.http
        .post(`${this.apiUrl}/admin/favorites`, {
          userId: this.userId,
          productId: product._id,
        })
        .subscribe({
          next: () => {
            this.favorites.next([...current, product]);
          },
          error: (err) => {
            console.error('Error adding favorite:', err);
          },
        });
    } else {
      const updated = [...current, product];
      this.favorites.next(updated);
      this.saveFavoritesToStorage(updated);
    }
  }

  removeFavorite(productId: string): void {
    const current = this.favorites.value;
    const updated = current.filter((p) => p._id !== productId);

    if (this.useDatabase && this.userId) {
      this.http.delete(`${this.apiUrl}/admin/favorites/${this.userId}/${productId}`).subscribe({
        next: () => {
          this.favorites.next(updated);
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
        },
      });
    } else {
      this.favorites.next(updated);
      this.saveFavoritesToStorage(updated);
    }
  }

  toggleFavorite(product: FavoriteProduct): void {
    const current = this.favorites.value;
    const exists = current.some((p) => p._id === product._id);

    if (this.useDatabase && this.userId) {
      this.http
        .post(`${this.apiUrl}/admin/favorites/toggle`, {
          userId: this.userId,
          productId: product._id,
        })
        .subscribe({
          next: (res: any) => {
            if (res.isFavorite) {
              if (!exists) {
                this.favorites.next([...current, product]);
              }
            } else {
              const updated = current.filter((p) => p._id !== product._id);
              this.favorites.next(updated);
            }
          },
          error: (err) => {
            console.error('Error toggling favorite:', err);
          },
        });
    } else {
      if (exists) {
        this.removeFavorite(product._id);
      } else {
        this.addFavorite(product);
      }
    }
  }

  isFavorite(productId: string): boolean {
    return this.favorites.value.some((p) => p._id === productId);
  }

  getFavorites(): FavoriteProduct[] {
    return this.favorites.value;
  }

  getFavoritesCount(): number {
    return this.favorites.value.length;
  }

  clearFavorites(): void {
    this.favorites.next([]);
    if (!this.useDatabase) {
      this.saveFavoritesToStorage([]);
    }
  }
}
