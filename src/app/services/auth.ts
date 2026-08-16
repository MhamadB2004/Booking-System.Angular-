import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
private url = '/api';
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

  // جلب البروفايل
getProfile() {
  return this.http.get<any>(`${this.url}/auth/profile`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    })
  });
}

// تحديث البروفايل
updateProfile(data: any) {
  return this.http.put<any>(`${this.url}/auth/profile`, data, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    })
  });
}

// تغيير كلمة المرور
changePassword(data: any) {
  return this.http.put<any>(`${this.url}/auth/change-password`, data, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    })
  });
}

forgotPassword(email: string) {
  return this.http.post(`${this.url}/auth/forgot-password`, { email });
}

resetPassword(token: string, newPassword: string) {
  return this.http.post(`${this.url}/auth/reset-password`, { token, newPassword });
}
resendVerification(email: string) {
  return this.http.post(`${this.url}/auth/resend-verification`, { email });
}
}