import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotificationService {
private url = 'https://localhost:7167/api';
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any>(`${this.url}/notifications`, {
      headers: this.getHeaders()
    });
  }

  markAsRead(id: number) {
    return this.http.patch(
      `${this.url}/notifications/${id}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  markAllAsRead() {
    return this.http.patch(
      `${this.url}/notifications/read-all`, {}, {
      headers: this.getHeaders()
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}