import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactRequest {
  _id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone: string;
  userProfileImage?: string;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = 'http://localhost:3000/api/contact';

  constructor(private http: HttpClient) {}

  createRequest(payload: { userId: string; phone: string; reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, payload);
  }

  getUserRequests(userId: string): Observable<ContactRequest[]> {
    return this.http.get<ContactRequest[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Admin
  getAllRequests(): Observable<ContactRequest[]> {
    return this.http.get<ContactRequest[]>(`${this.apiUrl}/admin/all`);
  }

  approveRequest(id: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/approve/${id}`, { adminNotes: adminNotes || '' });
  }

  rejectRequest(id: string, adminNotes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/reject/${id}`, { adminNotes: adminNotes || '' });
  }
}
