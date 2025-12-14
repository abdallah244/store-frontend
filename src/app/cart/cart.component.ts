import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItemVM } from '../services/cart.service';
import { AdminService } from '../services/admin.service';
import { OrderService, CreateOrderDto } from '../services/order.service';
import { OrderSuccessModalComponent } from '../components/order-success-modal/order-success-modal.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderSuccessModalComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  paymentMethod = signal<'online' | 'cod'>('cod');
  deliveryFee = signal<number>(50);
  currency = 'EGP';
  isOrderModalOpen = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    public cart: CartService,
    private adminService: AdminService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.loadDeliveryFee();
  }

  private loadDeliveryFee() {
    this.adminService.getDeliveryFee().subscribe({
      next: (fee) => this.deliveryFee.set(fee.amount || 50),
      error: () => this.deliveryFee.set(50),
    });
  }

  trackById(i: number, item: CartItemVM) {
    return item.productId + (item.selectedSize || '') + (item.selectedColor || '');
  }

  inc(item: CartItemVM) {
    this.cart.updateQuantity(
      item.productId,
      item.quantity + 1,
      item.selectedSize,
      item.selectedColor
    );
  }
  dec(item: CartItemVM) {
    if (item.quantity > 1)
      this.cart.updateQuantity(
        item.productId,
        item.quantity - 1,
        item.selectedSize,
        item.selectedColor
      );
  }
  remove(item: CartItemVM) {
    this.cart.removeItem(item.productId, item.selectedSize, item.selectedColor);
  }
  clear() {
    this.cart.clearCart();
  }

  total(list: CartItemVM[]): number {
    return list.reduce((sum, i) => sum + i.total, 0);
  }

  getDiscountedPrice(item: CartItemVM): number {
    if (!item.discount || item.discount === 0) {
      return item.unitPrice;
    }
    return item.unitPrice * (1 - item.discount / 100);
  }

  getSavings(item: CartItemVM): number {
    if (!item.discount || item.discount === 0) {
      return 0;
    }
    return (item.unitPrice * item.discount) / 100;
  }

  totalWithDelivery(list: CartItemVM[]): number {
    return this.total(list) + this.deliveryFee();
  }

  checkout() {
    this.isProcessing.set(true);
    this.errorMessage.set('');

    // Get current cart items from BehaviorSubject
    const items = this.cart.items.value;
    if (items.length === 0) {
      this.isProcessing.set(false);
      return;
    }

    const orderData: CreateOrderDto = {
      items: items.map((item: CartItemVM) => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        quantity: item.quantity,
        unitPrice: this.getDiscountedPrice(item),
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        total: item.total,
      })),
      subtotal: this.total(items),
      deliveryFee: this.deliveryFee(),
      totalAmount: this.totalWithDelivery(items),
      paymentMethod: this.paymentMethod(),
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.isProcessing.set(false);
        this.isOrderModalOpen.set(true);
        // Clear cart after successful order
        this.cart.clearCart();
      },
      error: (error) => {
        this.isProcessing.set(false);
        console.error('Order error:', error);
        if (error.error?.requiresProfileCompletion) {
          this.errorMessage.set('Please complete your profile first');
          // Redirect to profile page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        } else {
          this.errorMessage.set(error.error?.message || 'Error placing order. Please try again.');
        }
      },
    });
  }

  closeOrderModal() {
    this.isOrderModalOpen.set(false);
    this.router.navigate(['/products']);
  }
}
