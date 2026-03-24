import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BookingService {
private url = 'https://localhost:7167/api';
  constructor(private http: HttpClient) {}

  create(data: any) {
    return this.http.post<any>(`${this.url}/bookings`, data, {
      headers: this.getHeaders()
    });
  }

  getMyBookings() {
    return this.http.get<any[]>(`${this.url}/bookings/my`, {
      headers: this.getHeaders()
    });
  }

  getPropertyBookings(propertyId: number) {
    return this.http.get<any[]>(
      `${this.url}/bookings/property/${propertyId}`, {
      headers: this.getHeaders()
    });
  }

  confirm(id: number) {
    return this.http.patch(`${this.url}/bookings/${id}/confirm`, {}, {
      headers: this.getHeaders()
    });
  }

  cancel(id: number) {
    return this.http.patch(`${this.url}/bookings/${id}/cancel`, {}, {
      headers: this.getHeaders()
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}