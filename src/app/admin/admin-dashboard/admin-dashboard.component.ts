import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AdminService, User, HomeContent, ContactRequest } from '../../services/admin.service';
import { OrderService, Order } from '../../services/order.service';
import { FeedbackService, Feedback } from '../../services/feedback.service';
import { DeliveryFeeModalComponent } from '../../components/delivery-fee-modal/delivery-fee-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, DeliveryFeeModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [AdminService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  adminEmail: string = '';
  currentTime: string = '';
  activeTab: string = 'dashboard';

  // Users Management
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  successMessage: string = '';

  // Admins Management
  admins: User[] = [];
  filteredAdmins: User[] = [];
  adminSearchQuery: string = '';
  adminsLoading: boolean = false;

  // Feedback Management
  pendingFeedbacks: Feedback[] = [];
  allFeedbacks: Feedback[] = [];
  feedbacksLoading: boolean = false;
  feedbackFilter: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';
  selectedFeedback: Feedback | null = null;
  feedbackAdminNotes: string = '';

  // Contact Requests
  contactRequests: ContactRequest[] = [];
  contactLoading: boolean = false;
  contactAdminNotes: string = '';

  // Home content editing
  homeContent = {
    heroTitle: 'Artisan Craftsmanship Meets Modern Elegance',
    heroSubtitle: 'Handcrafted apparel from local artisans. Every stitch tells a story.',
    primaryButtonText: 'Explore Collection',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Book Consultation',
    secondaryButtonLink: '/tailoring',
    heroBackgroundUrl: '',
    features: [
      {
        icon: 'fas fa-hand-holding-heart',
        title: 'Handcrafted Excellence',
        description:
          'Each piece is carefully crafted by skilled artisans with years of experience.',
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
    ],
    advertisements: [] as Array<{ imageUrl: string; link?: string; alt?: string }>,
  };

  // Advertisement management
  newAd = { imageUrl: '', link: '', alt: '' };
  adImageFile: File | null = null;
  adImagePreview: string = '';

  // Delivery Fee Modal
  deliveryFeeModalOpen: boolean = false;

  // Navbar Brand Edit Modal
  navbarBrandModalOpen: boolean = false;
  navbarBrandName: string = 'LOCAL CRAFT';
  navbarBrandTagline: string = 'Premium Selection';
  navbarBrandLogoUrl: string = '';
  navbarBrandLogoFile: File | null = null;
  navbarBrandLogoPreview: string = '';

  // Performance optimization - debounced save
  private saveSubject = new Subject<void>();
  isSavingHome: boolean = false;
  // Debounced auto-save for navbar brand
  private brandSaveSubject = new Subject<void>();
  isSavingBrand: boolean = false;
  // Debounced save for About content
  private saveAboutSubject = new Subject<void>();
  isSavingAbout: boolean = false;

  // Product Management
  products: any[] = [];
  // Orders for stats
  orders: Order[] = [];
  // Dashboard stats box
  dashboardStats = {
    ordersSent: 0,
    totalRevenue: 0,
    totalStockAvailable: 0,
    totalProductsListed: 0,
  };
  newProduct = {
    name: '',
    description: '',
    price: 0,
    image: '',
    images: [] as string[],
    stock: 0,
    discount: 0,
    isOnSale: false,
    category: 'Apparel',
    gender: 'unisex',
    colors: [] as { name: string; code: string }[],
    sizes: [] as string[],
  };
  newCategoryName: string = '';
  productImageFile: File | null = null;
  productImagePreview: string = '';
  editingProductId: string | null = null;
  productsLoading: boolean = false;
  productFormLoading: boolean = false; // Loading state for form submissions

  // Colors and Sizes Management
  newColor = { name: '', code: '#000000' };
  newSize: string = '';
  productImages: string[] = [];
  newProductImageFile: File | null = null;
  newProductImagePreview: string = '';

  // About page content
  aboutContent = {
    heroImage: '/assets/about/hero.jpg',
    brandStory: '',
    brandImage: '/assets/about/brand-story.jpg',
    ceoStory: '',
    ceoImage: '/assets/team/ceo.jpg',
    stats: [] as Array<{ label: string; value: string; icon: string }>,
    teamMembers: [] as Array<{
      id: string;
      name: string;
      position: string;
      image: string;
      bio: string;
    }>,
  };

  // Success Modal
  showSaveSuccessModal: boolean = false;
  successModalMessage: string = '';
  saveModalSuccess: boolean = true;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private feedbackService: FeedbackService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // Get admin email from localStorage
    this.adminEmail = localStorage.getItem('adminEmail') || 'Admin';

    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Load initial data
    this.loadUsers();
    this.loadAdmins();
    this.loadHomeContent();
    this.loadAboutContent();
    this.loadProducts();
    this.loadOrdersForStats();
    // Setup debounced save for home content
    this.saveSubject.pipe(debounceTime(800)).subscribe(() => this._performSaveHomeContent());
    // Setup debounced save for about content
    this.saveAboutSubject.pipe(debounceTime(800)).subscribe(() => this._performSaveAboutContent());
    // Setup debounced auto-save for brand (name/tagline/logo preview)
    this.brandSaveSubject.pipe(debounceTime(600)).subscribe(() => this._performAutoSaveBrand());

    // Load brand settings from backend
    this.fetchBrandSettings();
  }
  fetchBrandSettings() {
    fetch('http://localhost:3000/api/brand/settings')
      .then((r) => r.json())
      .then((doc) => {
        if (doc?.name) this.navbarBrandName = doc.name;
        if (doc?.tagline) this.navbarBrandTagline = doc.tagline;
        if (doc?.logoUrl) {
          const v = Date.now();
          this.navbarBrandLogoUrl = `${doc.logoUrl}?v=${v}`;
          this.navbarBrandLogoPreview = this.navbarBrandLogoUrl;
        }
        this.cdr.markForCheck();
      })
      .catch(() => {});
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Tab Navigation
  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'users') {
      this.loadUsers();
    } else if (tab === 'admins') {
      this.loadAdmins();
    } else if (tab === 'feedback') {
      this.loadAllFeedbacks();
      this.loadPendingFeedbacks();
    } else if (tab === 'edit-home') {
      this.loadHomeContent();
    } else if (tab === 'edit-about') {
      this.loadAboutContent();
    } else if (tab === 'edit-products') {
      this.loadProducts();
    } else if (tab === 'contact') {
      this.loadContactRequests();
    }
  }

  // Navbar Brand Editor
  openNavbarBrandModal() {
    this.navbarBrandModalOpen = true;
    this.cdr.markForCheck();
  }

  closeNavbarBrandModal() {
    this.navbarBrandModalOpen = false;
    this.navbarBrandLogoFile = null;
    this.cdr.markForCheck();
  }

  onNavbarBrandLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.navbarBrandLogoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.navbarBrandLogoPreview = reader.result as string;
      // Trigger auto-save to persist text values; logo upload requires explicit Save
      this.brandSaveSubject.next();
      // Auto-upload logo so it reflects immediately
      this.uploadNavbarLogo();
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onNavbarBrandNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.navbarBrandName = input.value;
    this.brandSaveSubject.next();
  }

  onNavbarBrandTaglineInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.navbarBrandTagline = input.value;
    this.brandSaveSubject.next();
  }

  private uploadNavbarLogo() {
    if (!this.navbarBrandLogoFile) return;
    const adminSecret = localStorage.getItem('ADMIN_SECRET') || '';
    this.isSavingBrand = true;
    const fd = new FormData();
    fd.append('logo', this.navbarBrandLogoFile);
    fetch('http://localhost:3000/api/brand/settings/logo', {
      method: 'POST',
      headers: { 'x-admin-email': this.adminEmail, 'x-admin-secret': adminSecret },
      body: fd,
    })
      .then((r) => r.json())
      .then((logoResp) => {
        if (logoResp?.logoUrl) {
          const v = Date.now();
          this.navbarBrandLogoUrl = `${logoResp.logoUrl}?v=${v}`;
          this.navbarBrandLogoPreview = this.navbarBrandLogoUrl;
          window.dispatchEvent(new Event('brand-updated'));
        }
        this.isSavingBrand = false;
        this.cdr.markForCheck();
      })
      .catch((err) => {
        console.error('Logo upload failed', err);
        this.isSavingBrand = false;
        this.cdr.markForCheck();
      });
  }

  private _performAutoSaveBrand() {
    const name = this.navbarBrandName.trim();
    const tagline = this.navbarBrandTagline.trim();
    const adminSecret = localStorage.getItem('ADMIN_SECRET') || '';
    this.isSavingBrand = true;
    fetch('http://localhost:3000/api/brand/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': this.adminEmail,
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify({ name, tagline }),
    })
      .then(() => {
        // Notify navbar to refresh immediately
        window.dispatchEvent(new Event('brand-updated'));
        this.isSavingBrand = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.isSavingBrand = false;
        this.cdr.markForCheck();
      });
  }

  saveNavbarBrandSettings() {
    const name = this.navbarBrandName.trim();
    const tagline = this.navbarBrandTagline.trim();
    const adminSecret = localStorage.getItem('ADMIN_SECRET') || '';

    this.isSavingBrand = true;
    this.cdr.markForCheck();

    // First update text fields
    fetch('http://localhost:3000/api/brand/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': this.adminEmail,
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify({ name, tagline }),
    })
      .then((r) => r.json())
      .then(() => {
        // Then upload logo if selected
        if (this.navbarBrandLogoFile) {
          const fd = new FormData();
          fd.append('logo', this.navbarBrandLogoFile);
          return fetch('http://localhost:3000/api/brand/settings/logo', {
            method: 'POST',
            headers: { 'x-admin-email': this.adminEmail, 'x-admin-secret': adminSecret },
            body: fd,
          }).then((r) => r.json());
        }
        return Promise.resolve(null);
      })
      .then((logoResp) => {
        if (logoResp?.logoUrl) {
          const v = Date.now();
          this.navbarBrandLogoUrl = `${logoResp.logoUrl}?v=${v}`;
          this.navbarBrandLogoPreview = this.navbarBrandLogoUrl;
        }
        this.isSavingBrand = false;
        this.showSuccessMessage('Brand settings saved successfully! ✓');
        this.closeNavbarBrandModal();
        // Notify user navbar to refresh immediately
        window.dispatchEvent(new Event('brand-updated'));
        this.cdr.markForCheck();
      })
      .catch((err) => {
        this.isSavingBrand = false;
        this.showSuccessMessage('Failed to save brand settings. Please try again.');
        console.error('Brand save error:', err);
        this.cdr.markForCheck();
      });
  }

  // Page Builder Methods - Removed (Edit Home will be separate component)

  // User Management Methods
  loadUsers() {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filterUsers();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  filterUsers() {
    if (this.searchQuery.trim() === '') {
      this.filteredUsers = this.users;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      );
    }
    this.cdr.markForCheck();
  }

  getAdminCount(): number {
    return this.admins.length;
  }

  getBannedCount(): number {
    return this.users.filter((user) => user.banned).length;
  }

  searchUsers(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.filterUsers();
  }

  banUser(userId: string) {
    this.adminService.banUser(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccessMessage('User banned successfully!');
      },
    });
  }

  unbanUser(userId: string) {
    this.adminService.unbanUser(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccessMessage('User unbanned successfully!');
      },
    });
  }

  promoteToAdmin(userId: string) {
    this.adminService.promoteToAdmin(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccessMessage('User promoted to admin!');
      },
    });
  }

  demoteFromAdmin(userId: string) {
    this.adminService.demoteFromAdmin(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccessMessage('Admin privileges removed!');
      },
    });
  }

  // Contact requests
  loadContactRequests() {
    this.contactLoading = true;
    this.adminService.getContactRequests().subscribe({
      next: (requests) => {
        this.contactRequests = requests;
        this.contactLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.contactLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  approveContact(req: ContactRequest) {
    this.adminService.approveContactRequest(req._id, this.contactAdminNotes).subscribe({
      next: () => {
        this.contactAdminNotes = '';
        this.loadContactRequests();
        this.showSuccessMessage('Contact request approved!');
        this.cdr.markForCheck();
      },
    });
  }

  rejectContact(req: ContactRequest) {
    this.adminService.rejectContactRequest(req._id, this.contactAdminNotes).subscribe({
      next: () => {
        this.contactAdminNotes = '';
        this.loadContactRequests();
        this.showSuccessMessage('Contact request rejected');
        this.cdr.markForCheck();
      },
    });
  }

  deleteUser(userId: string, userName: string) {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}'s account? This action cannot be undone.`
      )
    ) {
      return;
    }

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccessMessage('User account deleted successfully!');
      },
      error: (err) => {
        this.showSuccessMessage('Failed to delete user account');
      },
    });
  }

  // Admins Management Methods
  loadAdmins() {
    this.adminsLoading = true;
    this.adminService.getAllAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.filterAdmins();
        this.adminsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.adminsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  filterAdmins() {
    if (this.adminSearchQuery.trim() === '') {
      this.filteredAdmins = this.admins;
    } else {
      const query = this.adminSearchQuery.toLowerCase();
      this.filteredAdmins = this.admins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query)
      );
    }
    this.cdr.markForCheck();
  }

  searchAdmins(event: Event) {
    const input = event.target as HTMLInputElement;
    this.adminSearchQuery = input.value;
    this.filterAdmins();
  }

  demoteAdminToUser(adminId: string) {
    if (!confirm('Are you sure you want to remove admin privileges from this user?')) {
      return;
    }

    this.adminService.demoteFromAdmin(adminId).subscribe({
      next: () => {
        this.loadAdmins();
        this.loadUsers(); // Refresh users list as well
        this.showSuccessMessage('Admin demoted to user successfully!');
      },
      error: (err) => {
        this.showSuccessMessage('Failed to demote admin');
      },
    });
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  private showSuccessModal(message: string, isSuccess: boolean = true) {
    this.successModalMessage = message;
    this.saveModalSuccess = isSuccess;
    this.showSaveSuccessModal = true;
    this.cdr.markForCheck();
  }

  closeSuccessModal() {
    this.showSaveSuccessModal = false;
    this.successModalMessage = '';
    this.saveModalSuccess = true;
    this.cdr.markForCheck();
  }

  // Home content methods
  loadHomeContent() {
    this.adminService.getHomeContent().subscribe({
      next: (content) => {
        this.homeContent = { ...content };
        console.log('Home content loaded successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load home content:', err);
        this.cdr.markForCheck();
      },
    });
  }

  saveHomeContent() {
    if (this.isSavingHome) return;
    this.saveSubject.next();
  }

  private _performSaveHomeContent() {
    if (this.isSavingHome) return;
    this.isSavingHome = true;
    this.adminService.updateHomeContent(this.homeContent).subscribe({
      next: () => {
        console.log('Home content saved successfully');
        window.dispatchEvent(new Event('homeContentUpdated'));
        this.showSuccessModal('Changes saved!', true);
        this.isSavingHome = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to save home content:', err);
        this.showSuccessModal('Save failed!', false);
        this.isSavingHome = false;
        this.cdr.markForCheck();
      },
    });
  }

  addFeature() {
    if (this.homeContent.features.length >= 8) {
      alert('Maximum 8 features allowed');
      return;
    }
    this.homeContent.features = [
      ...this.homeContent.features,
      {
        icon: 'fas fa-star',
        title: 'New Feature',
        description: 'Add description...',
      },
    ];
  }

  removeFeature(index: number) {
    this.homeContent.features = this.homeContent.features.filter((_, i) => i !== index);
  }

  trackByFeatureIndex(index: number): number {
    return index;
  }

  trackByAdIndex(index: number): number {
    return index;
  }

  onHomeHeroImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    console.log('Uploading hero image...');
    this.adminService.uploadHeroImage(file).subscribe({
      next: (response) => {
        this.homeContent.heroBackgroundUrl = `http://localhost:3000${response.url}`;
        console.log('Hero image uploaded successfully');
        this.showSuccessMessage('Image uploaded successfully');
      },
      error: (err) => {
        console.error('Failed to upload image:', err);
        this.showSuccessMessage('Failed to upload image');
      },
    });
  }

  clearHeroImage() {
    this.homeContent.heroBackgroundUrl = '';
  }

  // Advertisement Management Methods
  onAdImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    this.adImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.adImagePreview = e.target.result;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  addAdvertisement() {
    if (!this.adImageFile) {
      alert('Please select an image for the advertisement');
      return;
    }

    const formData = new FormData();
    formData.append('adImage', this.adImageFile);
    formData.append('link', this.newAd.link || '');
    formData.append('alt', this.newAd.alt || '');

    this.adminService.uploadAdImage(formData).subscribe({
      next: (response: any) => {
        this.homeContent.advertisements = [
          ...this.homeContent.advertisements,
          {
            imageUrl: `http://localhost:3000${response.url}`,
            link: this.newAd.link,
            alt: this.newAd.alt,
          },
        ];
        this.saveHomeContent();
        this.newAd = { imageUrl: '', link: '', alt: '' };
        this.adImageFile = null;
        this.adImagePreview = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload ad image:', err);
        alert('Failed to upload image');
      },
    });
  }
  removeAdvertisement(index: number) {
    if (confirm('Are you sure you want to remove this advertisement?')) {
      this.homeContent.advertisements = this.homeContent.advertisements.filter(
        (_, i) => i !== index
      );
      this.saveHomeContent();
    }
  }

  // Feedback Management Methods
  loadPendingFeedbacks() {
    this.feedbacksLoading = true;
    this.feedbackService.getPendingFeedbacks().subscribe({
      next: (feedbacks) => {
        this.pendingFeedbacks = feedbacks;
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading feedbacks:', err);
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadAllFeedbacks() {
    this.feedbacksLoading = true;
    this.feedbackService.getAllFeedbacks().subscribe({
      next: (feedbacks) => {
        this.allFeedbacks = feedbacks;
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading feedbacks:', err);
        this.feedbacksLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getFilteredFeedbacks(): Feedback[] {
    const notDeleted = (f: Feedback) => !f.deletedByUser && !f.deletedByAdmin;
    if (this.feedbackFilter === 'all') {
      return this.allFeedbacks.filter(notDeleted);
    }
    return this.allFeedbacks.filter((f) => f.status === this.feedbackFilter && notDeleted(f));
  }

  selectFeedback(feedback: Feedback) {
    this.selectedFeedback = feedback;
    this.feedbackAdminNotes = feedback.adminNotes || '';
  }

  setFeedbackFilter(filter: 'pending' | 'approved' | 'rejected' | 'all') {
    this.feedbackFilter = filter;
    this.selectedFeedback = null;
    this.feedbackAdminNotes = '';
  }

  approveFeedback() {
    if (!this.selectedFeedback) return;

    this.feedbackService
      .approveFeedback(this.selectedFeedback._id || '', this.feedbackAdminNotes)
      .subscribe({
        next: (response) => {
          this.showSuccessMessage('Feedback approved');
          this.selectedFeedback = null;
          this.loadAllFeedbacks();
          this.loadPendingFeedbacks();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error approving feedback:', err);
        },
      });
  }

  rejectFeedback() {
    if (!this.selectedFeedback) return;

    this.feedbackService
      .rejectFeedback(this.selectedFeedback._id || '', this.feedbackAdminNotes)
      .subscribe({
        next: (response) => {
          this.showSuccessMessage('Feedback rejected');
          this.selectedFeedback = null;
          this.loadAllFeedbacks();
          this.loadPendingFeedbacks();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error rejecting feedback:', err);
        },
      });
  }

  deleteFeedback(feedbackId: string) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    this.feedbackService.deleteFeedback(feedbackId).subscribe({
      next: (response) => {
        this.showSuccessMessage('Feedback deleted');
        this.selectedFeedback = null;
        this.loadAllFeedbacks();
        this.loadPendingFeedbacks();
      },
      error: (err) => {
        console.error('Error deleting feedback:', err);
      },
    });
  }

  // About Page Methods
  loadAboutContent(): void {
    this.adminService.getAboutContent().subscribe({
      next: (content: any) => {
        if (content) {
          this.aboutContent = {
            heroImage: content.heroImage || '/assets/about/hero.jpg',
            brandStory: content.brandStory || '',
            brandImage: content.brandImage || '/assets/about/brand-story.jpg',
            ceoStory: content.ceoStory || '',
            ceoImage: content.ceoImage || '/assets/team/ceo.jpg',
            stats: content.stats || [],
            teamMembers: content.teamMembers || [],
          };
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading about content:', err);
      },
    });
  }

  saveAboutContent(): void {
    if (this.isSavingAbout) return;
    this.saveAboutSubject.next();
  }

  private _performSaveAboutContent(): void {
    if (this.isSavingAbout) return;
    this.isSavingAbout = true;
    this.adminService.updateAboutContent(this.aboutContent).subscribe({
      next: () => {
        this.showSuccessModal('About changes saved!', true);
        // Notify other parts of the app (public About page) to reload content
        window.dispatchEvent(new Event('aboutContentUpdated'));
        this.isSavingAbout = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error saving about content:', err);
        this.showSuccessModal('Save failed!', false);
        this.isSavingAbout = false;
        this.cdr.markForCheck();
      },
    });
  }

  addStatistic(): void {
    this.aboutContent.stats = [
      ...this.aboutContent.stats,
      { label: '', value: '', icon: 'fas fa-star' },
    ];
    this.cdr.markForCheck();
  }

  removeStatistic(index: number): void {
    this.aboutContent.stats = this.aboutContent.stats.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  addTeamMember(): void {
    this.aboutContent.teamMembers = [
      ...this.aboutContent.teamMembers,
      {
        id: Date.now().toString(),
        name: '',
        position: '',
        image: '',
        bio: '',
      },
    ];
    this.cdr.markForCheck();
  }

  removeTeamMember(index: number): void {
    this.aboutContent.teamMembers = this.aboutContent.teamMembers.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  trackByStatIndex(index: number): number {
    return index;
  }

  trackByTeamIndex(index: number): number {
    return index;
  }

  onBrandImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    this.adminService.uploadAboutImage(formData).subscribe({
      next: (res) => {
        this.aboutContent.brandImage = res.url;
        this.showSuccessMessage('Brand image uploaded');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload brand image', err);
        this.showErrorMessage('Failed to upload brand image');
      },
    });
  }

  onHeroImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    this.adminService.uploadAboutImage(formData).subscribe({
      next: (res) => {
        this.aboutContent.heroImage = res.url;
        this.showSuccessMessage('Hero image uploaded');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload hero image', err);
        this.showErrorMessage('Failed to upload hero image');
      },
    });
  }

  onCeoImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    this.adminService.uploadAboutImage(formData).subscribe({
      next: (res) => {
        this.aboutContent.ceoImage = res.url;
        this.showSuccessMessage('CEO image uploaded');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload CEO image', err);
        this.showErrorMessage('Failed to upload CEO image');
      },
    });
  }

  onTeamImageSelected(index: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    this.adminService.uploadAboutImage(formData).subscribe({
      next: (res) => {
        this.aboutContent.teamMembers[index].image = res.url;
        this.showSuccessMessage('Team image uploaded');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to upload team image', err);
        this.showErrorMessage('Failed to upload team image');
      },
    });
  }

  showErrorMessage(message: string): void {
    this.successModalMessage = message;
    this.saveModalSuccess = false;
    this.showSaveSuccessModal = true;
    setTimeout(() => {
      this.showSaveSuccessModal = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  // Product Management Methods
  loadProducts(): void {
    this.productsLoading = true;
    this.adminService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.computeDashboardStats();
        this.productsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.showErrorMessage('Failed to load products');
        this.productsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Orders (for stats box only)
  loadOrdersForStats(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.computeDashboardStats();
        this.cdr.markForCheck();
      },
      error: () => {
        // Keep stats from products only
        this.computeDashboardStats();
        this.cdr.markForCheck();
      },
    });
  }

  private computeDashboardStats(): void {
    // Orders sent: consider approved or completed as sent
    const sentStatuses = new Set(['approved', 'completed']);
    this.dashboardStats.ordersSent = this.orders.filter((o) => sentStatuses.has(o.status)).length;

    // Revenue: sum of (totalAmount - deliveryFee) for approved or completed orders
    // This counts the product stock revenue only, excluding delivery fees
    this.dashboardStats.totalRevenue = this.orders
      .filter((o) => sentStatuses.has(o.status))
      .reduce((sum, o) => {
        const productRevenue = (o.totalAmount || 0) - (o.deliveryFee || 0);
        return sum + productRevenue;
      }, 0);

    // Stock available: sum of products stock
    this.dashboardStats.totalStockAvailable = (this.products || []).reduce(
      (sum: number, p: any) => sum + (Number(p.stock) || 0),
      0
    );

    // Total listed products
    this.dashboardStats.totalProductsListed = (this.products || []).length;
  }

  onMainProductImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    this.productImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.productImagePreview = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  addOrUpdateProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.stock) {
      this.showErrorMessage('Please fill in all required fields');
      return;
    }

    this.productFormLoading = true;
    this.cdr.markForCheck();

    if (this.productImageFile) {
      const formData = new FormData();
      formData.append('image', this.productImageFile);

      this.adminService.uploadProductImage(formData).subscribe({
        next: (res) => {
          this.newProduct.image = res.url;
          this.saveProduct();
        },
        error: (err) => {
          console.error('Failed to upload product image', err);
          this.showErrorMessage('Failed to upload product image');
          this.productFormLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (!this.newProduct.image) {
      this.showErrorMessage('Please select a product image');
      this.productFormLoading = false;
      this.cdr.markForCheck();
      return;
    } else {
      this.saveProduct();
    }
  }

  saveProduct(): void {
    // Ensure we only send actual uploaded image URLs
    // Accept both absolute (http://.../uploads/...) and relative (/uploads/...) paths
    const cleanedImages = (this.newProduct.images || []).filter(
      (img) => !!img && (img.startsWith('/uploads/') || img.includes('/uploads/'))
    );

    const productToSave = {
      name: this.newProduct.name,
      description: this.newProduct.description,
      price: this.newProduct.price,
      image: this.newProduct.image, // Only the URL, not base64
      images: cleanedImages, // Only URLs, no base64
      stock: this.newProduct.stock,
      discount: this.newProduct.discount,
      isOnSale: this.newProduct.isOnSale,
      category: this.newProduct.category,
      gender: this.newProduct.gender,
      colors: this.newProduct.colors,
      sizes: this.newProduct.sizes,
    };

    if (this.editingProductId) {
      this.adminService.updateProduct(this.editingProductId, productToSave).subscribe({
        next: () => {
          this.showSuccessMessage('Product updated successfully');
          this.productFormLoading = false;
          this.resetProductForm();
          this.loadProducts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to update product', err);
          this.showErrorMessage('Failed to update product');
          this.productFormLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.adminService.createProduct(productToSave).subscribe({
        next: () => {
          this.showSuccessMessage('Product added successfully');
          this.productFormLoading = false;
          this.resetProductForm();
          this.loadProducts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to create product', err);
          this.showErrorMessage('Failed to create product');
          this.productFormLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  editProduct(product: any): void {
    this.newProduct = { ...product };
    this.editingProductId = product._id;
    this.productImagePreview = product.image;
    this.productImageFile = null;
    this.productImages = product.images || [];
    this.cdr.markForCheck();
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => {
          this.showSuccessMessage('Product deleted successfully');
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to delete product', err);
          this.showErrorMessage('Failed to delete product');
        },
      });
    }
  }

  resetProductForm(): void {
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      image: '',
      images: [],
      stock: 0,
      discount: 0,
      isOnSale: false,
      category: 'Apparel',
      gender: 'unisex',
      colors: [],
      sizes: [],
    };
    this.newCategoryName = '';
    this.productImageFile = null;
    this.productImagePreview = '';
    this.productImages = [];
    this.newColor = { name: '', code: '#000000' };
    this.newSize = '';
    this.editingProductId = null;
    this.cdr.markForCheck();
  }

  // Colors Management
  addColor(): void {
    if (this.newColor.name.trim() && this.newColor.code.trim()) {
      this.newProduct.colors.push({ ...this.newColor });
      this.newColor = { name: '', code: '#000000' };
      this.cdr.markForCheck();
    }
  }

  removeColor(index: number): void {
    this.newProduct.colors.splice(index, 1);
    this.cdr.markForCheck();
  }

  // Sizes Management
  addSize(): void {
    if (this.newSize.trim() && !this.newProduct.sizes.includes(this.newSize)) {
      this.newProduct.sizes.push(this.newSize);
      this.newSize = '';
      this.cdr.markForCheck();
    }
  }

  removeSize(index: number): void {
    this.newProduct.sizes.splice(index, 1);
    this.cdr.markForCheck();
  }

  // Images Management
  onProductImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newProductImagePreview = e.target.result;
        this.newProductImageFile = file;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  addProductImage(): void {
    if (this.newProductImageFile) {
      // Upload image to backend first
      const formData = new FormData();
      formData.append('image', this.newProductImageFile);

      this.adminService.uploadProductImage(formData).subscribe({
        next: (res) => {
          // Add the URL (not base64) to both arrays for consistency
          const imageUrl = res.url;
          this.newProduct.images.push(imageUrl);
          this.productImages.push(imageUrl);
          this.newProductImagePreview = '';
          this.newProductImageFile = null;
          this.showSuccessMessage('Image added successfully');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to upload image', err);
          this.showErrorMessage('Failed to upload image');
        },
      });
    }
  }

  removeProductImage(index: number): void {
    // Remove from both arrays to keep them in sync
    this.newProduct.images.splice(index, 1);
    this.productImages.splice(index, 1);
    this.cdr.markForCheck();
  }

  confirmNewCategory(): void {
    if (this.newCategoryName.trim()) {
      this.newProduct.category = this.newCategoryName.trim();
      this.newCategoryName = '';
      this.cdr.markForCheck();
    }
  }

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    this.router.navigate(['/admin/login']);
  }

  openDeliveryFeeModal() {
    this.deliveryFeeModalOpen = true;
    this.cdr.markForCheck();
  }

  closeDeliveryFeeModal() {
    this.deliveryFeeModalOpen = false;
    this.cdr.markForCheck();
  }

  onDeliveryFeeUpdated() {
    this.successMessage = 'Delivery fee updated successfully!';
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  // Quick actions: Analytics and Settings
  openAnalytics() {
    // Navigate to analytics route if available; fallback to users tab
    try {
      this.router.navigate(['/admin/analytics']);
    } catch {
      this.setActiveTab('users');
    }
  }

  openSettings() {
    // Navigate to settings route if available; fallback to admins tab
    try {
      this.router.navigate(['/admin/settings']);
    } catch {
      this.setActiveTab('admins');
    }
  }
}
