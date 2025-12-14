import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { FavoritesService, FavoriteProduct } from '../services/favorites.service';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { ProductDetailsModalComponent } from './product-details-modal/product-details-modal.component';
import {
  ProductSelectionModalComponent,
  ProductVariant,
} from '../components/product-selection-modal/product-selection-modal.component';
import { AddToCartConfirmationModalComponent } from '../components/add-to-cart-confirmation-modal/add-to-cart-confirmation-modal.component';
import { Observable } from 'rxjs';

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
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductDetailsModalComponent,
    ProductSelectionModalComponent,
    AddToCartConfirmationModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error: string | null = null;

  // Search and Filter Properties
  searchText = '';
  selectedGender = 'all';
  selectedCategory = 'all';
  categories: string[] = [];
  genderOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
  ];

  // Modal Properties
  selectedProduct: Product | null = null;
  showDetailModal = false;

  // Selection Modal
  productForSelection: ProductVariant | null = null;
  showSelectionModal = false;
  pendingAddToCart: { product: ProductVariant; size?: string; color?: string } | null = null;

  // Confirmation Modal
  showConfirmationModal = false;
  lastAddedProductName = '';

  // Favorites Properties
  favorites$: Observable<FavoriteProduct[]>;
  showFavorites = false;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    public favoritesService: FavoritesService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.favorites$ = this.favoritesService.favorites$;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.products = data;
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error loading products:', err);
        this.error = 'Failed to load products';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  extractCategories(): void {
    const uniqueCategories = new Set(
      this.products.map((p) => p.category).filter((c): c is string => c !== undefined && c !== null)
    );
    this.categories = Array.from(uniqueCategories).sort();
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter((product) => {
      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchText.toLowerCase());

      // Gender filter
      const matchesGender = this.selectedGender === 'all' || product.gender === this.selectedGender;

      // Category filter
      const matchesCategory =
        this.selectedCategory === 'all' || product.category === this.selectedCategory;

      return matchesSearch && matchesGender && matchesCategory;
    });

    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onGenderChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  getDiscountedPrice(price: number, discount?: number): number {
    if (!discount || discount === 0) {
      return price;
    }
    return price - (price * discount) / 100;
  }

  isStockAvailable(stock: number): boolean {
    return stock > 0;
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.showDetailModal = true;
    this.cdr.markForCheck();
  }

  closeProductDetail(): void {
    this.showDetailModal = false;
    this.selectedProduct = null;
    this.cdr.markForCheck();
  }

  toggleFavorite(product: Product, event?: MouseEvent): void {
    event?.stopPropagation();
    const favoriteProduct: FavoriteProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      discount: product.discount,
      isOnSale: product.isOnSale,
    };
    this.favoritesService.toggleFavorite(favoriteProduct);
  }

  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  toggleShowFavorites(): void {
    this.showFavorites = !this.showFavorites;
    this.cdr.markForCheck();
  }

  removeFavorite(productId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.favoritesService.removeFavorite(productId);
  }

  trackByProductId(index: number, product: Product | FavoriteProduct): string {
    return product._id;
  }

  addToCart(product: Product, event?: MouseEvent): void {
    event?.stopPropagation();

    // Check if product has options that need selection
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors || hasSizes) {
      // Open selection modal
      this.productForSelection = {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        discount: product.discount,
        colors: product.colors,
        sizes: product.sizes,
      };
      this.showSelectionModal = true;
      this.cdr.markForCheck();
    } else {
      // Add directly
      this.addItemToCart(product, undefined, undefined);
    }
  }

  addFavoriteToCart(favorite: FavoriteProduct, event?: MouseEvent): void {
    event?.stopPropagation();

    // Convert FavoriteProduct to Product format and use same flow
    const product: Product = {
      _id: favorite._id,
      name: favorite.name,
      description: '',
      price: favorite.price,
      image: favorite.image,
      images: [],
      category: favorite.category || '',
      colors: [],
      sizes: [],
      discount: favorite.discount,
      stock: 0,
      createdAt: '',
      updatedAt: '',
    };

    this.addToCart(product, event);
  }

  onSelectionConfirm(selection: { size?: string; color?: string }): void {
    if (this.productForSelection) {
      const product = this.products.find((p) => p._id === this.productForSelection!._id);
      if (product) {
        this.addItemToCart(product, selection.size, selection.color);
      }
    }
    this.showSelectionModal = false;
    this.productForSelection = null;
    this.cdr.markForCheck();
  }

  private addItemToCart(product: Product, size?: string, color?: string): void {
    this.cartService.addItem({
      productId: product._id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      discount: product.discount,
      quantity: 1,
      selectedSize: size,
      selectedColor: color,
    });

    this.lastAddedProductName = product.name;
    this.showConfirmationModal = true;
    this.cdr.markForCheck();
  }

  onConfirmationContinue(): void {
    this.showConfirmationModal = false;
    this.cdr.markForCheck();
  }

  onDetailAddToCart(event: {
    product: Product;
    size?: string | null;
    color?: string | null;
  }): void {
    if (!event?.product) return;

    const product = this.products.find((p) => p._id === event.product._id) || event.product;
    const needsSize = product.sizes && product.sizes.length > 0;
    const needsColor = product.colors && product.colors.length > 0;

    const hasSize = !!event.size || !needsSize;
    const hasColor = !!event.color || !needsColor;

    if (hasSize && hasColor) {
      this.addItemToCart(product, event.size || undefined, event.color || undefined);
      this.closeProductDetail();
      return;
    }

    // If selections are missing, fallback to existing selection flow
    this.addToCart(product);
  }

  onConfirmationGoToCart(): void {
    this.showConfirmationModal = false;
    this.router.navigate(['/cart']);
  }
}
