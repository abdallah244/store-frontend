import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CartItemVM {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  discount?: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = environment.apiUrl || 'http://localhost:3000/api';
  items = new BehaviorSubject<CartItemVM[]>(this.loadFromStorage());
  items$ = this.items.asObservable();

  private get userId(): string | null {
    return localStorage.getItem('userId');
  }

  constructor(private http: HttpClient) {
    if (this.userId) {
      this.fetchFromDb();
    }
  }

  private loadFromStorage(): CartItemVM[] {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  }
  private saveToStorage(list: CartItemVM[]) {
    localStorage.setItem('cart', JSON.stringify(list));
  }

  private fetchFromDb() {
    this.http.get<any>(`${this.api}/cart/${this.userId}`).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.items)) this.items.next(res.items);
      },
      error: () => {},
    });
  }

  addItem(item: Omit<CartItemVM, 'total'>) {
    const price =
      item.discount && item.discount > 0
        ? item.unitPrice * (1 - item.discount / 100)
        : item.unitPrice;
    const newItem: CartItemVM = { ...item, total: price * item.quantity };

    const list = [...this.items.value];
    const idx = list.findIndex(
      (x) =>
        x.productId === item.productId &&
        x.selectedSize === item.selectedSize &&
        x.selectedColor === item.selectedColor
    );
    if (idx > -1) {
      const mergedQty = list[idx].quantity + item.quantity;
      list[idx] = { ...list[idx], quantity: mergedQty, total: price * mergedQty };
    } else {
      list.push(newItem);
    }
    this.persist(list);
  }

  updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    const list = [...this.items.value];
    const idx = list.findIndex(
      (x) => x.productId === productId && x.selectedSize === size && x.selectedColor === color
    );
    if (idx > -1) {
      const price =
        list[idx].discount && list[idx].discount > 0
          ? list[idx].unitPrice * (1 - list[idx].discount! / 100)
          : list[idx].unitPrice;
      list[idx] = { ...list[idx], quantity, total: price * quantity };
      this.persist(list);
    }
  }

  removeItem(productId: string, size?: string, color?: string) {
    const list = this.items.value.filter(
      (x) => !(x.productId === productId && x.selectedSize === size && x.selectedColor === color)
    );
    this.persist(list);
  }

  clearCart() {
    this.persist([]);
  }

  private persist(list: CartItemVM[]) {
    this.items.next(list);
    if (this.userId) {
      this.http
        .put(`${this.api}/cart/${this.userId}`, { items: list })
        .subscribe({ next: () => {}, error: () => {} });
    } else {
      this.saveToStorage(list);
    }
  }
}
