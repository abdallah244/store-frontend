import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-to-cart-confirmation-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-icon">
          <i class="fas fa-check-circle"></i>
        </div>

        <h2>Added to Cart!</h2>
        <p class="product-name">{{ productName }}</p>
        <p class="subtitle">Your item has been successfully added to your cart</p>

        <div class="modal-footer">
          <button class="btn-continue" (click)="continue.emit()">
            <i class="fas fa-shopping-bag"></i> Continue Shopping
          </button>
          <button class="btn-checkout" routerLink="/cart" (click)="goToCart.emit()">
            <i class="fas fa-shopping-cart"></i> View Cart
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-content {
        background: #111827;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 40px 32px;
        text-align: center;
        max-width: 400px;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-icon {
        font-size: 56px;
        color: #10b981;
        margin-bottom: 20px;
        animation: bounce 0.6s ease;
      }

      @keyframes bounce {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 12px 0;
        color: #fff;
      }

      .product-name {
        font-size: 16px;
        font-weight: 600;
        color: #dc2626;
        margin: 0 0 8px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .subtitle {
        font-size: 14px;
        color: #94a3b8;
        margin: 0 0 28px 0;
        line-height: 1.5;
      }

      .modal-footer {
        display: flex;
        gap: 12px;
        flex-direction: column;
      }

      .btn-continue,
      .btn-checkout {
        padding: 12px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
        font-size: 14px;
        text-decoration: none;
      }

      .btn-continue {
        background: transparent;
        border: 2px solid #334155;
        color: #e5e7eb;
      }

      .btn-continue:hover {
        background: rgba(51, 65, 85, 0.2);
        border-color: #64748b;
        transform: translateY(-1px);
      }

      .btn-checkout {
        background: #dc2626;
        color: #fff;
      }

      .btn-checkout:hover {
        background: #b91c1c;
        transform: translateY(-1px);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCartConfirmationModalComponent {
  @Input() productName: string = 'Product';
  @Output() continue = new EventEmitter<void>();
  @Output() goToCart = new EventEmitter<void>();

  onBackdropClick() {
    this.continue.emit();
  }
}
