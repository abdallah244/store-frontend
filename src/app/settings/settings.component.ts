import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContactService, ContactRequest } from '../services/contact.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  socialLinks = [
    { name: 'Instagram', icon: 'fab fa-instagram', url: '#' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: '#' },
    { name: 'Pinterest', icon: 'fab fa-pinterest', url: '#' },
    { name: 'Facebook', icon: 'fab fa-facebook', url: '#' },
  ];

  phone = '';
  reason = '';
  submitLoading = false;
  successMessage = '';
  errorMessage = '';
  requestsError = '';
  isLoadingRequests = false;
  requests: ContactRequest[] = [];
  latestRequest: ContactRequest | null = null;
  approvedCountValue = 0;
  pendingCountValue = 0;
  rejectedCountValue = 0;
  isLoggedIn = false;
  userId = '';
  userName = '';
  userProfileImage = '';

  constructor(
    private contactService: ContactService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLogin();
  }

  checkLogin() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.isLoggedIn = false;
      this.requests = [];
      this.updateRequestStats();
      this.cdr.markForCheck();
      return;
    }

    this.http.get(`http://localhost:3000/api/auth/user/${userId}`).subscribe({
      next: (resp: any) => {
        if (resp.user) {
          this.isLoggedIn = true;
          this.userId = resp.user._id;
          this.userName = resp.user.name;
          this.userProfileImage = resp.user.profileImage || '';
          this.loadRequests();
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.isLoggedIn = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadRequests() {
    if (!this.userId) return;
    this.isLoadingRequests = true;
    this.requestsError = '';
    this.contactService.getUserRequests(this.userId).subscribe({
      next: (reqs) => {
        this.requests = reqs;
        this.updateRequestStats();
        this.isLoadingRequests = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingRequests = false;
        this.requestsError = 'Failed to load your requests. Please try again.';
        this.requests = [];
        this.updateRequestStats();
        this.cdr.markForCheck();
      },
    });
  }

  submitRequest() {
    if (!this.isLoggedIn) {
      this.errorMessage = 'Please login first';
      return;
    }
    if (!this.phone.trim() || !this.reason.trim()) {
      this.errorMessage = 'Phone and reason are required';
      return;
    }

    this.submitLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.contactService
      .createRequest({ userId: this.userId, phone: this.phone.trim(), reason: this.reason.trim() })
      .subscribe({
        next: (res) => {
          this.submitLoading = false;
          this.successMessage = 'Your request has been sent. Someone will contact you soon.';
          this.reason = '';
          this.loadRequests();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.submitLoading = false;
          this.errorMessage = err.error?.message || 'Failed to send request';
          this.cdr.markForCheck();
        },
      });
  }

  get pendingCount(): number {
    return this.pendingCountValue;
  }

  get approvedCount(): number {
    return this.approvedCountValue;
  }

  get rejectedCount(): number {
    return this.rejectedCountValue;
  }

  getLatestStatus(): ContactRequest | null {
    return this.latestRequest;
  }

  private updateRequestStats() {
    this.approvedCountValue = this.requests.filter((r) => r.status === 'approved').length;
    this.pendingCountValue = this.requests.filter((r) => r.status === 'pending').length;
    this.rejectedCountValue = this.requests.filter((r) => r.status === 'rejected').length;
    this.latestRequest = this.requests.length ? this.requests[0] : null;
  }
}
