import { Component } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageTransitionService } from '../services/page-transition.service';

@Component({
  selector: 'app-signin',
  imports: [HttpClientModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  name: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  profileImage: File | null = null;
  profileImagePreview: string | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private pageTransition: PageTransitionService
  ) {}

  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size must be less than 5MB';
        return;
      }

      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        this.error = 'Only image files are allowed';
        return;
      }

      this.profileImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfileImage() {
    this.profileImage = null;
    this.profileImagePreview = null;
  }

  register() {
    this.loading = true;
    this.error = '';
    this.success = '';

    const name = this.name.trim();
    const email = this.email.trim();
    const phone = this.phone.trim();
    const password = this.password.trim();
    const confirmPassword = this.confirmPassword.trim();

    if (!name || !email || !phone || !password || !confirmPassword) {
      this.error = 'Please fill in all fields';
      this.loading = false;
      return;
    }

    if (!this.profileImage) {
      this.error = 'Please upload a profile image';
      this.loading = false;
      return;
    }

    // Validate Egyptian phone number
    if (!/^(010|011|012|015)\d{8}$/.test(phone)) {
      this.error = 'Please enter a valid Egyptian phone number (010, 011, 012, or 015)';
      this.loading = false;
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.error = 'Please enter a valid email address';
      this.loading = false;
      return;
    }

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match';
      this.loading = false;
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    if (this.profileImage) {
      formData.append('profileImage', this.profileImage);
    }

    this.http.post('http://localhost:3000/api/auth/register', formData).subscribe(
      (response: any) => {
        this.loading = false;
        this.success = 'Account created successfully! Redirecting to login...';
        setTimeout(() => {
          this.pageTransition.navigateWithTransition('/login');
        }, 2000);
      },
      (error) => {
        this.loading = false;
        this.error = error.error.error || 'Registration failed';
      }
    );
  }

  goToLogin() {
    this.pageTransition.navigateWithTransition('/login');
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
