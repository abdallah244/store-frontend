import { Component } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageTransitionService } from '../services/page-transition.service';

@Component({
  selector: 'app-login',
  imports: [HttpClientModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';
  showPassword: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private pageTransition: PageTransitionService
  ) {}

  login() {
    this.loading = true;
    this.error = '';

    const email = this.email.trim();
    const password = this.password.trim();

    if (!email || !password) {
      this.error = 'Please fill in all fields';
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

    // Prevent rapid re-submission
    if (this.loading) {
      // Loading flag already true ensures single in-flight request
    }

    this.http
      .post('http://localhost:3000/api/auth/login', {
        email,
        password,
      })
      .subscribe(
        (response: any) => {
          this.loading = false;
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userName', response.name);
          localStorage.setItem('userEmail', response.email);
          this.pageTransition.navigateWithTransition('/home');
        },
        (error) => {
          this.loading = false;
          this.error = error.error.error || 'Login failed';
        }
      );
  }

  goToSignIn() {
    this.pageTransition.navigateWithTransition('/signin');
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
