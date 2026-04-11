import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';
import { NotificationStateService } from '../../services/notification-state';




@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  url = 'https://localhost:7167/api';
  notifications: any[] = [];
  unreadCount = 0;
  loading = true;


  selectedNotif: any = null;
  
  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notifState: NotificationStateService

  ) {}

  ngOnInit() { this.load(); }

  getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

load() {
  this.loading = true;
  this.http.get<any>(`${this.url}/notifications`, {
    headers: this.getHeaders()
  }).subscribe({
    next: (res) => {
      this.notifications = res.notifications || [];
      this.unreadCount = res.unreadCount || 0;
      this.notifState.setCount(this.unreadCount);
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => { this.loading = false; }
  });
}

markAsRead(id: number) {
  this.http.patch(`${this.url}/notifications/${id}/read`, {}, {
    headers: this.getHeaders(),
    responseType: 'text' as 'json'
  }).subscribe({
    next: () => {
      const n = this.notifications.find(n => n.id === id);
      if (n && !n.isRead) {
        n.isRead = true;
        this.unreadCount--;
        this.notifState.decrement();
      }
      this.cdr.detectChanges();
    }
  });
}

markAllRead() {
  this.http.patch(`${this.url}/notifications/read-all`, {}, {
    headers: this.getHeaders(),
    responseType: 'text' as 'json'
  }).subscribe({
    next: () => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
      this.notifState.reset();
      this.cdr.detectChanges();
    }
  });
}

  deleteNotif(id: number) {
    this.http.delete(`${this.url}/notifications/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.cdr.detectChanges();
      }
    });
  }

showDetail(n: any) {
  this.selectedNotif = n;
  if (!n.isRead) this.markAsRead(n.id);
  this.cdr.detectChanges();
}

closeDetail() {
  this.selectedNotif = null;
  this.cdr.detectChanges();
}
}