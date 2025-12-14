import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PageTransitionService } from '../services/page-transition.service';
import { AdminService } from '../services/admin.service';
import { FeedbackService, Feedback } from '../services/feedback.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isLoggedIn = false;
  userName = '';

  // Modal states
  showPrivacyModal = false;
  showReturnsModal = false;
  showOrdersModal = false;

  // Discount rotation
  currentDiscountIndex = 0;
  discountInterval: any;

  // Static content with runtime overrides
  heroTitle = 'Artisan Craftsmanship Meets Modern Elegance';
  heroSubtitle = 'Handcrafted apparel from local artisans. Every stitch tells a story.';
  primaryButtonText = 'Explore Collection';
  primaryButtonLink = '/products';
  secondaryButtonText = 'Book Consultation';
  secondaryButtonLink = '/tailoring';
  heroBackgroundUrl = '';

  features = [
    {
      icon: 'fas fa-hand-holding-heart',
      title: 'Handcrafted Excellence',
      description: 'Each piece is carefully crafted by skilled artisans with years of experience.',
    },
    {
      icon: 'fas fa-leaf',
      title: 'Sustainable Materials',
      description: 'We use eco-friendly fabrics that are kind to the environment and your skin.',
    },
    {
      icon: 'fas fa-shipping-fast',
      title: 'Fast Delivery',
      description: 'Get your orders delivered quickly and safely to your doorstep.',
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 Support',
      description: 'Our dedicated team is always ready to help you with any questions.',
    },
  ];

  reviews = [
    {
      name: 'أحمد علي',
      role: 'Customer',
      rating: 5,
      comment: 'الجودة ممتازة جداً والخدمة رائعة. سأشتري مرة أخرى!',
      date: '2025-12-01',
    },
    {
      name: 'فاطمة محمد',
      role: 'Customer',
      rating: 5,
      comment: 'منتجات رائعة وسعر عادل. أنصح الجميع بالشراء منهم.',
      date: '2025-11-28',
    },
    {
      name: 'محمود حسن',
      role: 'Customer',
      rating: 4,
      comment: 'الملابس جميلة لكن التسليم استغرق وقت أطول قليلاً.',
      date: '2025-11-25',
    },
  ];

  // Feedbacks from database
  latestFeedbacks: Feedback[] = [];
  feedbacksLoading = false;
  currentFeedbackIndex = 0;
  carouselInterval: any;

  // Advertisements marquee
  advertisements: Array<{ imageUrl: string; link?: string; alt?: string }> = [];
  marqueeInterval: any;

  discounts = [
    '🎉 Summer Sale - Up to 50% OFF!',
    '⭐ New Collection Available Now!',
    '🎁 Free Shipping on Orders Over 500 EGP',
  ];

  navItems = [
    { name: 'Products', path: '/products', icon: 'fas fa-box-open' },
    { name: 'My Orders', path: '/orders', icon: 'fas fa-shopping-bag' },
    { name: 'Cart', path: '/cart', icon: 'fas fa-shopping-cart' },
    { name: 'Feedback', path: '/feedback', icon: 'fas fa-comment-dots' },
    { name: 'My Feedback', path: '/my-feedback', icon: 'fas fa-list-check' },
    { name: 'My Profile', path: '/profile', icon: 'fas fa-user-circle' },
    { name: 'Contact Us', path: '/contact-us', icon: 'fas fa-envelope' },
  ];

  constructor(
    private router: Router,
    private pageTransition: PageTransitionService,
    private adminService: AdminService,
    private feedbackService: FeedbackService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHomeContent();
    this.loadLatestFeedbacks();
    this.checkLoginStatus();
    this.startDiscountRotation();
    window.addEventListener('storage', this.handleStorageChange);
    window.addEventListener('homeContentUpdated', this.handleContentUpdate);
  }

  loadHomeContent() {
    // Load from API
    this.adminService.getHomeContent().subscribe({
      next: (content) => {
        console.log('Loading home content from DB:', content);

        this.heroTitle = content.heroTitle || this.heroTitle;
        this.heroSubtitle = content.heroSubtitle || this.heroSubtitle;
        this.primaryButtonText = content.primaryButtonText || this.primaryButtonText;
        this.primaryButtonLink = content.primaryButtonLink || this.primaryButtonLink;
        this.secondaryButtonText = content.secondaryButtonText || this.secondaryButtonText;
        this.secondaryButtonLink = content.secondaryButtonLink || this.secondaryButtonLink;
        this.heroBackgroundUrl = content.heroBackgroundUrl || '';

        console.log('Hero background URL from DB:', this.heroBackgroundUrl);

        if (Array.isArray(content.features) && content.features.length) {
          this.features = content.features;
        }

        if (Array.isArray(content.advertisements) && content.advertisements.length) {
          this.advertisements = content.advertisements;
        }

        // Trigger change detection for OnPush strategy
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load home content from DB', err);
      },
    });
  }

  handleStorageChange = (event: StorageEvent) => {
    // Not needed anymore since we use DB, but keep for compatibility
  };

  handleContentUpdate = () => {
    this.loadHomeContent();
  };

  loadLatestFeedbacks() {
    this.feedbacksLoading = true;
    this.feedbackService.getPublicFeedbacks().subscribe({
      next: (feedbacks) => {
        // Take only the latest 6 feedbacks and exclude any soft-deleted ones
        const clean = feedbacks.filter((f) => !f.deletedByAdmin && !f.deletedByUser);
        this.latestFeedbacks = clean.slice(0, 6);
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
        this.startCarouselAutoPlay();
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Carousel methods
  nextFeedback() {
    if (this.currentFeedbackIndex < this.latestFeedbacks.length - 1) {
      this.currentFeedbackIndex++;
    } else {
      this.currentFeedbackIndex = 0;
    }
  }

  prevFeedback() {
    if (this.currentFeedbackIndex > 0) {
      this.currentFeedbackIndex--;
    } else {
      this.currentFeedbackIndex = this.latestFeedbacks.length - 1;
    }
  }

  goToFeedback(index: number) {
    this.currentFeedbackIndex = index;
  }

  startCarouselAutoPlay() {
    this.stopCarouselAutoPlay();
    if (this.latestFeedbacks.length <= 1) return;
    this.carouselInterval = setInterval(() => {
      this.nextFeedback();
      this.cdr.markForCheck();
    }, 5000); // Auto-advance every 5 seconds
  }

  stopCarouselAutoPlay() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  toggleLike(feedback: Feedback) {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      alert('Please login to like feedbacks');
      return;
    }

    if (!feedback._id) return;

    this.feedbackService.toggleLike(feedback._id, userId).subscribe({
      next: (response) => {
        // Update local feedback object
        feedback.likes = response.likes;
        if (!feedback.likedBy) feedback.likedBy = [];

        if (response.isLiked) {
          feedback.likedBy.push(userId);
        } else {
          feedback.likedBy = feedback.likedBy.filter((id) => id !== userId);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        alert('Failed to update like');
      },
    });
  }

  isLikedByCurrentUser(feedback: Feedback): boolean {
    const userId = localStorage.getItem('userId');
    if (!userId || !feedback.likedBy) return false;
    return feedback.likedBy.includes(userId);
  }

  checkLoginStatus() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (userId && userName) {
      this.isLoggedIn = true;
      this.userName = userName;
    } else {
      this.isLoggedIn = false;
      this.userName = '';
    }
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.isLoggedIn = false;
    this.userName = '';
    this.pageTransition.navigateWithTransition('/login');
  }

  startDiscountRotation() {
    this.stopDiscountRotation();
    if (this.discounts.length <= 1) return;
    this.discountInterval = setInterval(() => {
      this.currentDiscountIndex = (this.currentDiscountIndex + 1) % this.discounts.length;
      this.cdr.markForCheck();
    }, 4000);
  }

  stopDiscountRotation() {
    if (this.discountInterval) {
      clearInterval(this.discountInterval);
      this.discountInterval = null;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getStars(rating: number): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < rating);
  }

  // Modal methods
  openPrivacyModal() {
    this.showPrivacyModal = true;
    this.cdr.markForCheck();
  }

  closePrivacyModal() {
    this.showPrivacyModal = false;
    this.cdr.markForCheck();
  }

  openReturnsModal() {
    this.showReturnsModal = true;
    this.cdr.markForCheck();
  }

  closeReturnsModal() {
    this.showReturnsModal = false;
    this.cdr.markForCheck();
  }

  openOrdersModal() {
    this.showOrdersModal = true;
    this.cdr.markForCheck();
  }

  closeOrdersModal() {
    this.showOrdersModal = false;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.stopDiscountRotation();
    this.stopCarouselAutoPlay();
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('homeContentUpdated', this.handleContentUpdate);
  }
}
