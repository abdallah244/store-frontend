import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(true);
  selectedOrder = signal<Order | null>(null);
  filterStatus = signal<string>('all');
  searchTerm = signal<string>('');
  errorMessage = signal<string>('');
  stockErrorMessage = signal<string>('');
  showStockError = signal<boolean>(false);
  isApprovingOrder = signal<boolean>(false);
  currentSlide = signal<number>(0);
  readonly slideSize = 5;

  constructor(private orderService: OrderService) {
    // Debug: Log admin status on init
    const adminId = localStorage.getItem('adminId');
    const adminEmail = localStorage.getItem('adminEmail');
    console.log('Admin Dashboard - Current Admin:', {
      adminId,
      adminEmail,
      isAdmin: !!adminId,
    });
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        console.log('✓ Orders loaded:', orders);
        this.orders.set(orders);
        this.isLoading.set(false);
        this.currentSlide.set(0);
      },
      error: (error) => {
        console.error('✗ Load orders error:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to load orders';
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);

        // If access denied, it means not logged in as admin
        if (error.status === 403) {
          this.errorMessage.set(
            'You must be logged in as an admin to view orders. Please login at /admin/login'
          );
        }
      },
    });
  }

  filteredOrders(): Order[] {
    let filtered = this.orders();

    // Filter by status
    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter((order) => order.status === this.filterStatus());
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (order) =>
          order.userName.toLowerCase().includes(search) ||
          order.userEmail.toLowerCase().includes(search) ||
          order.userPhone.includes(search) ||
          order._id.includes(search)
      );
    }

    return filtered;
  }

  getSlides(): Order[][] {
    const items = this.filteredOrders();
    const slides: Order[][] = [];
    for (let i = 0; i < items.length; i += this.slideSize) {
      slides.push(items.slice(i, i + this.slideSize));
    }
    // Ensure current slide is within bounds
    const maxIndex = Math.max(0, slides.length - 1);
    if (this.currentSlide() > maxIndex) {
      this.currentSlide.set(maxIndex);
    }
    return slides;
  }

  nextSlide() {
    const total = this.getSlides().length;
    const idx = this.currentSlide();
    if (idx < total - 1) this.currentSlide.set(idx + 1);
  }

  prevSlide() {
    const idx = this.currentSlide();
    if (idx > 0) this.currentSlide.set(idx - 1);
  }

  setSlide(index: number) {
    const total = this.getSlides().length;
    if (index >= 0 && index < total) this.currentSlide.set(index);
  }

  onFiltersChanged() {
    this.currentSlide.set(0);
  }

  viewOrder(order: Order) {
    this.selectedOrder.set(order);
  }

  closeOrderDetails() {
    this.selectedOrder.set(null);
  }

  approveOrder(order: Order) {
    if (confirm(`Are you sure you want to approve the order from ${order.userName}?`)) {
      this.isApprovingOrder.set(true);
      this.orderService.updateOrderStatus(order._id, 'approved').subscribe({
        next: () => {
          this.isApprovingOrder.set(false);
          alert('Order approved successfully! WhatsApp notification sent to customer.');
          this.loadOrders();
          this.closeOrderDetails();
        },
        error: (error) => {
          this.isApprovingOrder.set(false);
          // Check if error is due to insufficient stock
          if (error.status === 400 && error.error?.message?.includes('stock')) {
            this.stockErrorMessage.set(
              error.error?.message || 'Insufficient stock available for this order'
            );
            this.showStockError.set(true);
          } else {
            alert(error.error?.message || 'Error updating order status');
          }
          console.error(error);
        },
      });
    }
  }

  rejectOrder(order: Order) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason !== null) {
      this.orderService.updateOrderStatus(order._id, 'rejected', reason).subscribe({
        next: () => {
          alert('Order rejected successfully! WhatsApp notification sent to customer.');
          this.loadOrders();
          this.closeOrderDetails();
        },
        error: (error) => {
          alert('Error updating order status');
          console.error(error);
        },
      });
    }
  }

  deleteOrder(order: Order) {
    if (
      confirm(
        `Are you sure you want to delete the order from ${order.userName}? This action cannot be undone.`
      )
    ) {
      this.orderService.deleteOrder(order._id).subscribe({
        next: () => {
          alert('Order deleted successfully');
          this.loadOrders();
          this.closeOrderDetails();
        },
        error: (error) => {
          alert('Error deleting order');
          console.error(error);
        },
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#dc2626';
      case 'completed':
        return '#3b82f6';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#94a3b8';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  closeStockError() {
    this.showStockError.set(false);
  }
}
