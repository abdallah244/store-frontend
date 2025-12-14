import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-delivery-fee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-fee-modal.component.html',
  styleUrls: ['./delivery-fee-modal.component.css'],
})
export class DeliveryFeeModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() featureUpdated = new EventEmitter<void>();

  deliveryFee = signal<number>(50);
  loading = signal<boolean>(false);
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  constructor(private adminService: AdminService) {
    this.loadDeliveryFee();
  }

  private loadDeliveryFee() {
    this.adminService.getDeliveryFee().subscribe({
      next: (fee) => this.deliveryFee.set(fee.amount || 50),
      error: () => this.showMessage('error', 'Failed to load delivery fee'),
    });
  }

  updateDeliveryFee() {
    this.loading.set(true);
    this.message.set(null);

    this.adminService.updateDeliveryFee(this.deliveryFee()).subscribe({
      next: () => {
        this.showMessage('success', 'Delivery fee updated successfully');
        setTimeout(() => {
          this.featureUpdated.emit();
          this.onClose();
        }, 1500);
      },
      error: (error) => {
        console.error('Error updating delivery fee:', error);
        this.showMessage('error', 'Failed to update delivery fee');
      },
      complete: () => this.loading.set(false),
    });
  }

  private showMessage(type: 'success' | 'error', text: string) {
    this.message.set({ type, text });
  }

  onClose() {
    this.message.set(null);
    this.close.emit();
  }
}
