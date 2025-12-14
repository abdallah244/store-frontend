import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success-modal.component.html',
  styleUrls: ['./order-success-modal.component.css'],
})
export class OrderSuccessModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
