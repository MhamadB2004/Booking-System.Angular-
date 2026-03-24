import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
private url = 'https://localhost:7167/api';
  constructor(private http: HttpClient) {}

  register(data: any) {
    return this.http.post(`${this.url}/auth/register`, data);
  }

  login(data: any) {
    return this.http.post<any>(`${this.url}/auth/login`, data);
  }

  saveToken(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole() {
    return this.getUser()?.role;
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}