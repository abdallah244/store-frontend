import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feedback {
  _id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileImage?: string;
  title: string;
  description: string;
  rating: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  likes?: number;
  likedBy?: string[];
  deletedByUser?: boolean;
  deletedByAdmin?: boolean;
  deletedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/api/feedback';

  constructor(private http: HttpClient) {}

  // Create feedback
  createFeedback(
    feedback: Omit<Feedback, '_id' | 'userName' | 'userEmail' | 'status' | 'isPublic'>
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, feedback);
  }

  // Get all approved/public feedbacks
  getPublicFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/public`);
  }

  // Get user's own feedbacks
  getUserFeedbacks(userId: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Admin: Get all feedbacks
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/admin/all`);
  }

  // Admin: Get pending feedbacks
  getPendingFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/admin/pending`);
  }

  // Admin: Approve feedback
  approveFeedback(feedbackId: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/approve/${feedbackId}`, {
      adminNotes: adminNotes || '',
    });
  }

  // Admin: Reject feedback
  rejectFeedback(feedbackId: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/reject/${feedbackId}`, {
      adminNotes: adminNotes || '',
    });
  }

  // Admin: Delete feedback
  deleteFeedback(feedbackId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/delete/${feedbackId}`);
  }

  // User: Delete own feedback
  deleteOwnFeedback(feedbackId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/delete/${feedbackId}`, { body: { userId } });
  }

  // Toggle like on feedback
  toggleLike(feedbackId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/like/${feedbackId}`, { userId });
  }
}
