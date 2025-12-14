import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ProductVariant {
  _id: string;
  name: string;
  image: string;
  price: number;
  discount?: number;
  colors?: { name: string; code: string }[];
  sizes?: string[];
}

@Component({
  selector: 'app-product-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-selection-modal.component.html',
  styleUrls: ['./product-selection-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSelectionModalComponent {
  @Input() product!: ProductVariant;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ size?: string; color?: string }>();

  selectedSize: string | undefined;
  selectedColor: string | undefined;
  showError = false;

  get originalPrice(): string {
    return this.product?.price?.toFixed(2) || '0.00';
  }

  get discountedPrice(): string {
    if (!this.product?.price || !this.product?.discount) return '0.00';
    const disc = this.product.price * (1 - this.product.discount / 100);
    return disc.toFixed(2);
  }

  get displayPrice(): string {
    return this.product?.price?.toFixed(2) || '0.00';
  }

  onBackdropClick() {
    this.close.emit();
  }

  onConfirm() {
    const needsSize = this.product.sizes && this.product.sizes.length > 0;
    const needsColor = this.product.colors && this.product.colors.length > 0;

    const hasSizeSelected = !needsSize || this.selectedSize;
    const hasColorSelected = !needsColor || this.selectedColor;

    if (!hasSizeSelected || !hasColorSelected) {
      this.showError = true;
      return;
    }

    this.confirm.emit({
      size: this.selectedSize,
      color: this.selectedColor,
    });
  }
}
