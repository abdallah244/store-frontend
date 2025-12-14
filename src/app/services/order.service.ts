import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  selectedSize?: string;
  selectedColor?: string;
  total: number;
}

export interface CreateOrderDto {
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'online' | 'cod';
}

export interface Order {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'online' | 'cod';
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  adminNotes: string;
  orderDate: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/orders';

  createOrder(orderData: CreateOrderDto): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(`${this.apiUrl}`, orderData);
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my-orders`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/admin/all`);
  }

  // Cancel an order by user when status is pending
  cancelOrder(orderId: string): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(
      `${this.apiUrl}/${orderId}/cancel`,
      {}
    );
  }

  updateOrderStatus(
    orderId: string,
    status: string,
    adminNotes?: string
  ): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(
      `${this.apiUrl}/admin/${orderId}/status`,
      {
        status,
        adminNotes,
      }
    );
  }

  deleteOrder(orderId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/${orderId}`);
  }
}
