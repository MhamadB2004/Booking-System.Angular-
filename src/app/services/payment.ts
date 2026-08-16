import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PaymentService {
private url = '/api';
  constructor(private http: HttpClient) {}

  pay(data: any) {
    return this.http.post<any>(`${this.url}/payments`, data, {
      headers: this.getHeaders()
    });
  }

  getMyPayments() {
    return this.http.get<any[]>(`${this.url}/payments/my`, {
      headers: this.getHeaders()
    });
  }

  getByBooking(bookingId: number) {
    return this.http.get<any>(
      `${this.url}/payments/booking/${bookingId}`, {
      headers: this.getHeaders()
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}