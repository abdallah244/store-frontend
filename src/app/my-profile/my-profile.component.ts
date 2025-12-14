import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTransitionService } from '../services/page-transition.service';
import { Order, OrderService } from '../services/order.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
})
export class MyProfileComponent implements OnInit {
  user: any = null;
  loading = true;
  editMode = false;
  saving = false;
  error = '';
  success = '';
  joinedDate = '';

  // Form fields
  name = '';
  address = '';
  country = '';
  governorate = '';
  profileImage: File | null = null;
  profileImagePreview: string | null = null;

  // Orders
  orders: Order[] = [];
  ordersLoading = false;
  ordersError = '';
  pagedOrders: Order[][] = [];
  currentPage = 0;

  countries = [
    { name: 'Egypt', code: 'EG' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'UAE', code: 'AE' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Oman', code: 'OM' },
    { name: 'Yemen', code: 'YE' },
    { name: 'Jordan', code: 'JO' },
    { name: 'Palestine', code: 'PS' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Syria', code: 'SY' },
    { name: 'Iraq', code: 'IQ' },
  ];

  egyptianGovernorates = [
    'Alexandria',
    'Aswan',
    'Asyut',
    'Beheira',
    'Beni Suef',
    'Cairo',
    'Dakahlia',
    'Damietta',
    'Faiyum',
    'Gharbia',
    'Giza',
    'Ismailia',
    'Kafr El-Sheikh',
    'Luxor',
    'Matruh',
    'Minya',
    'Monufia',
    'New Valley',
    'North Sinai',
    'Port Said',
    'Qalyubia',
    'Red Sea',
    'Sharquia',
    'Sohag',
    'South Sinai',
    'Suez',
  ];

  constructor(
    private http: HttpClient,
    private pageTransition: PageTransitionService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadOrders();
    this.prepareCurrentMonthStats();
  }

  loadUserProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.error = 'User not logged in';
      this.loading = false;
      this.pageTransition.navigateWithTransition('/login');
      return;
    }

    this.http.get(`http://localhost:3000/api/auth/user/${userId}`).subscribe({
      next: (response: any) => {
        this.user = response.user;
        this.name = this.user?.name || '';
        this.address = this.user?.address || '';
        this.country = this.user?.country || '';
        this.governorate = this.user?.governorate || '';
        this.profileImagePreview = this.user?.profileImage
          ? `http://localhost:3000${this.user.profileImage}`
          : null;

        if (this.user?.createdAt) {
          const date = new Date(this.user.createdAt);
          this.joinedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load profile';
        this.loading = false;
      },
    });
  }

  loadOrders(): void {
    this.ordersLoading = true;
    this.ordersError = '';

    this.orderService.getUserOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.ordersLoading = false;
        this.buildPagedOrders();
        this.prepareCurrentMonthStats();
        this.buildMonthlyTrend();
      },
      error: (err) => {
        this.ordersError = err.error?.message || 'Failed to load orders';
        this.ordersLoading = false;
      },
    });
  }

  buildPagedOrders() {
    const size = 2; // show 2 orders per carousel page
    const pages: Order[][] = [];
    for (let i = 0; i < this.orders.length; i += size) {
      pages.push(this.orders.slice(i, i + size));
    }
    this.pagedOrders = pages;
    this.currentPage = 0;
  }

  nextPage() {
    if (this.currentPage < this.pagedOrders.length - 1) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 0) this.currentPage--;
  }

  cancelOrder(order: Order) {
    if (!order || order.status !== 'pending') return;
    this.orderService.cancelOrder(order._id).subscribe({
      next: () => {
        order.status = 'cancelled';
        this.success = 'Order cancelled and visible to admin.';
        this.buildPagedOrders();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: () => {
        this.error = 'Unable to cancel order right now';
        setTimeout(() => (this.error = ''), 3000);
      },
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.error = '';
    this.success = '';
  }

  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size must be less than 5MB';
        return;
      }

      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        this.error = 'Only image files are allowed';
        return;
      }

      this.profileImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfileImage() {
    this.profileImage = null;
    this.profileImagePreview = this.user.profileImage
      ? `http://localhost:3000${this.user.profileImage}`
      : null;
  }

  async saveProfile() {
    if (
      !this.name.trim() ||
      !this.address.trim() ||
      !this.country.trim() ||
      !this.governorate.trim()
    ) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const userId = localStorage.getItem('userId');

    try {
      // Upload image first if changed
      if (this.profileImage) {
        const formData = new FormData();
        formData.append('profileImage', this.profileImage);
        formData.append('userId', userId!);

        const uploadResp: any = await this.http
          .post(`http://localhost:3000/api/auth/user/${userId}/upload-image`, formData)
          .toPromise();
        // Update preview with cache-busted URL immediately
        if (uploadResp?.url) {
          const base = `http://localhost:3000${uploadResp.url}`;
          this.profileImagePreview = `${base}?v=${Date.now()}`;
        }
      }

      // Update profile data
      const response: any = await this.http
        .put(`http://localhost:3000/api/auth/user/${userId}`, {
          name: this.name,
          address: this.address,
          country: this.country,
          governorate: this.governorate,
        })
        .toPromise();

      this.user = response.user;
      // Ensure avatar shows fresh value after profile save
      if (this.user?.profileImage) {
        const base = `http://localhost:3000${this.user.profileImage}`;
        this.profileImagePreview = `${base}?v=${Date.now()}`;
      }
      // Do NOT store critical data in localStorage
      // Notify UI parts (like navbar) to refresh from backend
      window.dispatchEvent(new Event('user-updated'));
      this.editMode = false;
      this.success = 'Profile updated successfully!';
      setTimeout(() => {
        this.success = '';
      }, 3000);
    } catch (error: any) {
      this.error = error.error?.error || 'Failed to update profile';
    } finally {
      this.saving = false;
    }
  }

  cancelEdit() {
    this.name = this.user?.name || '';
    this.address = this.user?.address || '';
    this.country = this.user?.country || '';
    this.governorate = this.user?.governorate || '';
    this.profileImage = null;
    this.profileImagePreview = this.user?.profileImage
      ? `http://localhost:3000${this.user.profileImage}`
      : null;
    this.editMode = false;
    this.error = '';
    this.success = '';
  }

  countByStatus(status: Order['status']): number {
    return this.orders.filter((o) => o.status === status).length;
  }

  statusClass(status: Order['status']): string {
    if (status === 'approved') return 'success';
    if (status === 'pending') return 'pending';
    return 'danger';
  }

  statusLabel(status: Order['status']): string {
    const map: Record<string, string> = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  formatOrderDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  goToHome() {
    this.pageTransition.navigateWithTransition('/home');
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    this.pageTransition.navigateWithTransition('/login');
  }

  // Statistics calculations
  getTotalRevenue(): number {
    return this.orders
      .filter((o) => o.status === 'approved')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  getTotalPending(): number {
    return this.orders
      .filter((o) => o.status === 'pending')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  getAverageOrderValue(): number {
    if (this.orders.length === 0) return 0;
    return Math.round((this.getTotalRevenue() / this.countByStatus('approved')) * 100) / 100;
  }

  getTopOrderAmount(): number {
    if (this.orders.length === 0) return 0;
    return Math.max(...this.orders.map((o) => o.totalAmount || 0));
  }

  getSalesData() {
    const approved = this.countByStatus('approved');
    const pending = this.countByStatus('pending');
    const rejected = this.countByStatus('rejected') + this.countByStatus('cancelled');
    const total = approved + pending + rejected;

    return [
      {
        label: 'Approved',
        value: approved,
        percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
        color: 'success',
      },
      {
        label: 'Pending',
        value: pending,
        percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        color: 'pending',
      },
      {
        label: 'Rejected',
        value: rejected,
        percentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
        color: 'danger',
      },
    ];
  }

  // Monthly payments chart (current month daily bars)
  currentMonthBars: { day: string; amount: number; percent: number }[] = [];
  currentMonthTotal = 0;
  currentMonthCount = 0;
  currentMonthAvg = 0;

  prepareCurrentMonthStats() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const dailyTotals: Record<number, number> = {};
    this.orders.forEach((o) => {
      if (!o.orderDate) return;
      const d = new Date(o.orderDate);
      if (d.getMonth() === month && d.getFullYear() === year && o.status === 'approved') {
        const day = d.getDate();
        dailyTotals[day] = (dailyTotals[day] || 0) + (o.totalAmount || 0);
      }
    });

    const entries = Object.entries(dailyTotals)
      .map(([day, amount]) => ({ day: Number(day), amount }))
      .sort((a, b) => a.day - b.day);
    const max = Math.max(1, ...entries.map((e) => e.amount));
    this.currentMonthBars = entries.map((e) => ({
      day: String(e.day),
      amount: e.amount,
      percent: Math.round((e.amount / max) * 100),
    }));
    this.currentMonthTotal = entries.reduce((s, e) => s + e.amount, 0);
    this.currentMonthCount = entries.length;
    this.currentMonthAvg = this.currentMonthCount
      ? Math.round(this.currentMonthTotal / this.currentMonthCount)
      : 0;
  }

  // Saved addresses (simple in-memory list)
  addresses: { line: string; city: string; country: string }[] = [];
  addAddress() {
    const line = prompt('Address line');
    const city = prompt('City');
    const country = prompt('Country');
    if (line && city && country) this.addresses.push({ line, city, country });
  }
  editAddress(i: number) {
    const a = this.addresses[i];
    const line = prompt('Address line', a.line) || a.line;
    const city = prompt('City', a.city) || a.city;
    const country = prompt('Country', a.country) || a.country;
    this.addresses[i] = { line, city, country };
  }
  removeAddress(i: number) {
    this.addresses.splice(i, 1);
  }

  // Monthly trend with arrows comparing to previous month
  monthlyTrend: {
    label: string;
    amount: number;
    diff: number;
    direction: 'up' | 'down' | 'flat';
  }[] = [];
  buildMonthlyTrend() {
    const monthlyMap: Record<string, number> = {};
    this.orders.forEach((o) => {
      if (!o.orderDate) return;
      if (o.status !== 'approved') return;
      const d = new Date(o.orderDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (o.totalAmount || 0);
    });
    const entries = Object.entries(monthlyMap)
      .map(([key, amount]) => ({ key, amount }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));

    this.monthlyTrend = entries.map((entry, idx) => {
      const prev = idx > 0 ? entries[idx - 1].amount : entry.amount;
      const diff = entry.amount - prev;
      const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      const [year, month] = entry.key.split('-');
      const label = `${new Date(Number(year), Number(month) - 1).toLocaleString('en-US', {
        month: 'short',
      })} ${year}`;
      return { label, amount: entry.amount, diff: Math.abs(diff), direction };
    });
  }
}
