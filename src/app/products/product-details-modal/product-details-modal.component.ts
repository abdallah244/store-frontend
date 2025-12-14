import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  stock: number;
  discount?: number;
  isOnSale?: boolean;
  category?: string;
  gender?: string;
  colors?: { name: string; code: string }[];
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-product-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details-modal.component.html',
  styleUrls: ['./product-details-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsModalComponent implements OnInit {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<{
    product: Product;
    size?: string | null;
    color?: string | null;
  }>();

  currentImageIndex: number = 0;
  selectedColor: { name: string; code: string } | null = null;
  selectedSize: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.product?.images && this.product.images.length > 0) {
      this.currentImageIndex = 0;
    }
  }

  get allImages(): string[] {
    if (!this.product) return [];
    return [this.product.image, ...(this.product.images || [])];
  }

  get currentImage(): string {
    if (!this.product) return '';
    return this.allImages[this.currentImageIndex] || this.product.image;
  }

  get discountedPrice(): number {
    if (!this.product) return 0;
    const discount = this.product.discount || 0;
    return this.product.price - (this.product.price * discount) / 100;
  }

  previousImage(): void {
    if (this.allImages.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.allImages.length) % this.allImages.length;
    }
  }

  nextImage(): void {
    if (this.allImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.allImages.length;
    }
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.allImages.length) {
      this.currentImageIndex = index;
    }
  }

  selectColor(color: { name: string; code: string }): void {
    this.selectedColor = this.selectedColor?.name === color.name ? null : color;
  }

  selectSize(size: string): void {
    this.selectedSize = this.selectedSize === size ? null : size;
  }

  onAddToCart(): void {
    if (!this.product) return;

    this.addToCart.emit({
      product: this.product,
      size: this.selectedSize,
      color: this.selectedColor?.name || null,
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByColorName(index: number, color: { name: string; code: string }): string {
    return color.name;
  }

  trackBySize(index: number, size: string): string {
    return size;
  }
}
