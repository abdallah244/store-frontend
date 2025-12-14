import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FeedbackService, Feedback } from '../services/feedback.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent implements OnInit {
  @ViewChild('feedbackForm') feedbackForm?: ElementRef;

  // Form
  feedbackTitle = '';
  feedbackDescription = '';
  feedbackRating = 5;
  feedbackCategory = 'product';
  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  // Data
  allFeedbacks: Feedback[] = [];
  isLoadingFeedbacks = false;

  // User info
  isLoggedIn = false;
  userId = '';
  userName = '';
  userAccountCompleted = false;

  categories = [
    { value: 'product', label: 'Product Quality' },
    { value: 'service', label: 'Customer Service' },
    { value: 'delivery', label: 'Delivery Experience' },
    { value: 'customer-support', label: 'Support Quality' },
    { value: 'website', label: 'Website & App' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private feedbackService: FeedbackService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this.loadAllFeedbacks();
  }

  checkLoginStatus(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.isLoggedIn = false;
      return;
    }

    // Fetch user data from API
    this.http.get(`http://localhost:3000/api/auth/user/${userId}`).subscribe({
      next: (response: any) => {
        if (response.user) {
          this.isLoggedIn = true;
          this.userId = response.user._id;
          this.userName = response.user.name;
          // Check if account is completed
          this.userAccountCompleted =
            response.user.accountCompleted ||
            (response.user.address &&
              response.user.country &&
              response.user.governorate &&
              response.user.address.trim() !== '' &&
              response.user.country.trim() !== '' &&
              response.user.governorate.trim() !== '');
          this.cdr.markForCheck();
        } else {
          this.isLoggedIn = false;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        this.isLoggedIn = false;
        // If user not found, clear localStorage and redirect to login
        if (error.status === 404) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadAllFeedbacks(): void {
    this.isLoadingFeedbacks = true;
    this.feedbackService.getPublicFeedbacks().subscribe({
      next: (feedbacks) => {
        this.allFeedbacks = feedbacks;
        this.isLoadingFeedbacks = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.isLoadingFeedbacks = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleLike(feedback: Feedback): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login to like feedbacks');
      return;
    }

    if (!feedback._id) return;

    this.feedbackService.toggleLike(feedback._id, userId).subscribe({
      next: (response) => {
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

  submitFeedback(): void {
    // Validate login
    if (!this.isLoggedIn) {
      this.showError('Please log in to submit feedback');
      return;
    }

    // Validate account completion
    if (!this.userAccountCompleted) {
      this.showError('Please complete your profile before submitting feedback');
      this.router.navigate(['/profile']);
      return;
    }

    // Validate form
    if (!this.feedbackTitle.trim()) {
      this.showError('Please enter a feedback title');
      return;
    }

    if (!this.feedbackDescription.trim()) {
      this.showError('Please enter a detailed feedback description');
      return;
    }

    if (this.feedbackTitle.trim().length < 5) {
      this.showError('Feedback title must be at least 5 characters');
      return;
    }

    if (this.feedbackDescription.trim().length < 20) {
      this.showError('Feedback description must be at least 20 characters');
      return;
    }

    this.isSubmitting = true;
    const feedbackData = {
      userId: this.userId,
      title: this.feedbackTitle.trim(),
      description: this.feedbackDescription.trim(),
      rating: this.feedbackRating,
      category: this.feedbackCategory,
    };

    this.feedbackService.createFeedback(feedbackData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.showSuccess('Feedback submitted successfully! Our team will review it shortly.');
        this.resetForm();
        this.loadAllFeedbacks();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMsg = error.error?.message || 'Failed to submit feedback';
        this.showError(errorMsg);
        this.cdr.markForCheck();
      },
    });
  }

  resetForm(): void {
    this.feedbackTitle = '';
    this.feedbackDescription = '';
    this.feedbackRating = 5;
    this.feedbackCategory = 'product';
  }

  showSuccess(message: string): void {
    this.showSuccessMessage = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cdr.markForCheck();
    }, 5000);
  }

  showError(message: string): void {
    this.showErrorMessage = true;
    this.errorMessage = message;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.showErrorMessage = false;
      this.cdr.markForCheck();
    }, 5000);
  }

  getRatingClass(rating: number): string {
    if (rating >= 4) return 'rating-excellent';
    if (rating >= 3) return 'rating-good';
    if (rating >= 2) return 'rating-fair';
    return 'rating-poor';
  }

  getStars(count: number): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < count);
  }

  getCategoryLabel(categoryValue: string): string {
    const category = this.categories.find((c) => c.value === categoryValue);
    return category ? category.label : categoryValue;
  }

  scrollToForm(): void {
    if (this.feedbackForm) {
      this.feedbackForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
