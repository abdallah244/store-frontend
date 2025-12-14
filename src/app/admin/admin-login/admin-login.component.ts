import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent implements OnInit {
  // Login Step 1
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  // Master Code Step 2
  showMasterCodeModal: boolean = false;
  masterCode: string = '';
  tempToken: string = '';
  masterCodeLoading: boolean = false;
  masterCodeError: string = '';

  // Account Banned
  showAccountBannedModal: boolean = false;

  // Admin data after login
  adminData: any = null;

  private apiUrl = 'http://localhost:3000/api';

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Check if already logged in
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  // Step 1: Login with email and password
  login() {
    this.loading = true;
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      this.loading = false;
      return;
    }

    // Call backend admin login endpoint
    this.http
      .post<any>(`${this.apiUrl}/auth/admin/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          // Check if account is banned
          if (response.isBanned) {
            this.showAccountBannedModal = true;
            this.cdr.markForCheck();
            return;
          }
          this.adminData = response;

          // Request master code
          this.requestMasterCode(response.adminId);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error || 'Login failed. Please try again.';
        },
      });
  }

  // Step 1b: Request master code
  requestMasterCode(adminId: string) {
    this.http
      .post<any>(`${this.apiUrl}/auth/admin/request-master-code`, {
        adminId: adminId,
      })
      .subscribe({
        next: (response) => {
          this.tempToken = response.tempToken;
          this.showMasterCodeModal = true;
          this.masterCodeError = '';
          this.cdr.markForCheck();
          console.log('Master code sent to email: abdallahhfares@gmail.com');
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to send master code. Try again.';
          this.cdr.markForCheck();
        },
      });
  }

  // Step 2: Verify master code
  verifyMasterCode() {
    this.masterCodeLoading = true;
    this.masterCodeError = '';
    this.cdr.markForCheck();

    if (!this.masterCode || this.masterCode.length !== 6) {
      this.masterCodeError = 'Master code must be 6 digits';
      this.masterCodeLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.http
      .post<any>(`${this.apiUrl}/auth/admin/verify-master-code`, {
        tempToken: this.tempToken,
        masterCode: this.masterCode,
      })
      .subscribe({
        next: (response) => {
          this.masterCodeLoading = false;
          this.cdr.markForCheck();
          // Store admin token with admin info
          localStorage.setItem('adminToken', response.adminToken);
          localStorage.setItem('adminEmail', response.email);
          localStorage.setItem('adminId', response.adminId);
          localStorage.setItem('adminName', response.name);

          // Navigate to dashboard
          this.router.navigate(['/admin/dashboard']);
        },
        error: (err) => {
          this.masterCodeLoading = false;
          this.masterCodeError = err.error?.error || 'Invalid master code. Try again.';
          this.cdr.markForCheck();
        },
      });
  }

  // Close modal and go back
  closeMasterCodeModal() {
    this.showMasterCodeModal = false;
    this.masterCode = '';
    this.masterCodeError = '';
    this.email = '';
    this.password = '';
  }

  // Close banned account modal
  closeAccountBannedModal() {
    this.showAccountBannedModal = false;
    this.email = '';
    this.password = '';
  }
}
