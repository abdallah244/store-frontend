import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PageContent {
  heroTitle: string;
  heroSubtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  heroBackgroundColor: string;
  textColor: string;
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  heroBackgroundUrl: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  advertisements: Array<{
    imageUrl: string;
    link?: string;
    alt?: string;
  }>;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  address?: string;
  country?: string;
  governorate?: string;
  accountCompleted?: boolean;
  role: 'user' | 'admin';
  banned: boolean;
  createdAt: string;
}

export interface ContactRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userProfileImage?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api';
  private pageContent = new BehaviorSubject<PageContent>({
    heroTitle: 'Artisan Craftsmanship Meets Modern Elegance',
    heroSubtitle: 'Handcrafted apparel from local artisans. Every stitch tells a story.',
    primaryButtonText: 'Explore Collection',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Book Consultation',
    secondaryButtonLink: '/tailoring',
    heroBackgroundColor: '#0f0f0f',
    textColor: '#ffffff',
  });

  pageContent$ = this.pageContent.asObservable();

  constructor(private http: HttpClient) {
    this.loadPageContent();
  }

  getPageContent(): Observable<PageContent> {
    return this.http.get<PageContent>(`${this.apiUrl}/admin/page-content`);
  }

  updatePageContent(content: PageContent): Observable<PageContent> {
    return this.http.put<PageContent>(`${this.apiUrl}/admin/page-content`, content);
  }

  getPageContentSync(): PageContent {
    return this.pageContent.value;
  }

  updatePageContentLocal(content: PageContent) {
    this.pageContent.next(content);
  }

  private loadPageContent() {
    this.getPageContent().subscribe({
      next: (content) => this.pageContent.next(content),
      error: () => {
        // Use default content if API fails
      },
    });
  }

  // User Management
  getAllUsers(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(`${this.apiUrl}/auth/admin/users`)
      .pipe(map((response: any) => response.users));
  }

  getAllAdmins(): Observable<User[]> {
    return this.http
      .get<{ admins: User[] }>(`${this.apiUrl}/auth/admin/admins`)
      .pipe(map((response: any) => response.admins));
  }

  banUser(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/ban`, {});
  }

  unbanUser(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/unban`, {});
  }

  promoteToAdmin(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/promote`, {});
  }

  demoteFromAdmin(userId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/demote`, {});
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/users/${userId}`);
  }

  // Home Content Management
  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContent>(`${this.apiUrl}/admin/home-content`);
  }

  updateHomeContent(content: HomeContent): Observable<HomeContent> {
    return this.http.put<HomeContent>(`${this.apiUrl}/admin/home-content`, content);
  }

  uploadHeroImage(
    file: File
  ): Observable<{ success: boolean; url: string; homeContent: HomeContent }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ success: boolean; url: string; homeContent: HomeContent }>(
      `${this.apiUrl}/admin/home-content/hero-image`,
      formData
    );
  }

  uploadAdImage(formData: FormData): Observable<{ success: boolean; url: string }> {
    return this.http.post<{ success: boolean; url: string }>(
      `${this.apiUrl}/admin/home-content/ad-image`,
      formData
    );
  }

  // Contact requests
  getContactRequests(): Observable<ContactRequest[]> {
    return this.http.get<ContactRequest[]>(`${this.apiUrl}/contact/admin/all`);
  }

  approveContactRequest(id: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/contact/admin/approve/${id}`, {
      adminNotes: adminNotes || '',
    });
  }

  rejectContactRequest(id: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/contact/admin/reject/${id}`, {
      adminNotes: adminNotes || '',
    });
  }

  // About Page Management
  getAboutContent(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/about-content`);
  }

  updateAboutContent(content: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/about-content`, content);
  }

  uploadAboutImage(formData: FormData): Observable<{ success: boolean; url: string }> {
    return this.http.post<{ success: boolean; url: string }>(
      `${this.apiUrl}/admin/about-content/image`,
      formData
    );
  }

  // Product Management
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/products`);
  }

  getProduct(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/products/${id}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/products`, product);
  }

  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/products/${id}`);
  }

  uploadProductImage(formData: FormData): Observable<{ success: boolean; url: string }> {
    return this.http.post<{ success: boolean; url: string }>(
      `${this.apiUrl}/admin/products/image`,
      formData
    );
  }

  // Delivery Fee Management
  getDeliveryFee(): Observable<{ amount: number }> {
    return this.http.get<{ amount: number }>(`${this.apiUrl}/admin/delivery-fee`);
  }

  updateDeliveryFee(amount: number): Observable<{ amount: number }> {
    return this.http.put<{ amount: number }>(`${this.apiUrl}/admin/delivery-fee`, {
      amount,
    });
  }
}
