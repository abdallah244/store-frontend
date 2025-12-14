import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Feedback, FeedbackService } from '../services/feedback.service';

@Component({
  selector: 'app-my-feedback',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './my-feedback.component.html',
  styleUrls: ['./my-feedback.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFeedbackComponent implements OnInit {
  feedbacks: Feedback[] = [];
  isLoading = false;
  isLoggedIn = false;
  userId = '';
  userName = '';
  errorMessage = '';
  isLoadingUser = false;

  constructor(
    private feedbackService: FeedbackService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLogin();
  }

  private checkLogin(): void {
    const storedId =
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('_id') ||
      '';
    if (!storedId) {
      this.isLoggedIn = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingUser = true;
    this.http.get(`http://localhost:3000/api/auth/user/${storedId}`).subscribe({
      next: (resp: any) => {
        if (resp?.user) {
          this.isLoggedIn = true;
          this.userId = resp.user._id;
          this.userName = resp.user.name;
          this.loadMyFeedbacks();
        } else {
          this.isLoggedIn = false;
        }
        this.isLoadingUser = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoggedIn = false;
        this.isLoadingUser = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadMyFeedbacks(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.feedbackService.getUserFeedbacks(this.userId).subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'تعذر تحميل فيدباكاتك، حاول مرة أخرى لاحقاً.';
        this.cdr.markForCheck();
      },
    });
  }

  getStatusBadge(status: Feedback['status']): string {
    if (status === 'approved') return 'status approved';
    if (status === 'rejected') return 'status rejected';
    return 'status pending';
  }

  deleteFeedback(feedbackId: string | undefined): void {
    if (
      !feedbackId ||
      !confirm('Are you sure you want to delete this feedback? This action cannot be undone.')
    ) {
      return;
    }

    this.feedbackService.deleteOwnFeedback(feedbackId, this.userId).subscribe({
      next: () => {
        this.feedbacks = this.feedbacks.filter((f) => f._id !== feedbackId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error deleting feedback:', err);
        this.errorMessage = 'Failed to delete feedback. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  get approvedCount(): number {
    return this.feedbacks.filter((f) => f.status === 'approved').length;
  }

  get rejectedCount(): number {
    return this.feedbacks.filter((f) => f.status === 'rejected').length;
  }

  get pendingCount(): number {
    return this.feedbacks.filter((f) => f.status === 'pending').length;
  }
}
