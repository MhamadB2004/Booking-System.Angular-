import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';
import { NotificationStateService } from '../../services/notification-state';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  url = 'https://localhost:7167/api';
  notifications: any[] = [];
  unreadCount = 0;
  loading = true;

  selectedNotif: any = null;

  // فورم التقييم
  showReviewModal = false;
  reviewBookingId: number | null = null;
  reviewPropertyId: number | null = null;
  reviewPropertyName = '';
  reviewRating = 0;
  reviewHoverRating = 0;
  reviewComment = '';
  reviewLoading = false;
  reviewSuccess = '';
  reviewError = '';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notifState: NotificationStateService,
    private toast: ToastService
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

  // ===========================
  // فتح تفاصيل الإشعار
  // ===========================
  showDetail(n: any) {
    if (!n.isRead) this.markAsRead(n.id);

    // هل هو إشعار تقييم؟
    if (this.isReviewNotif(n)) {
      this.openReviewFromNotif(n);
      return;
    }

    this.selectedNotif = n;
    this.cdr.detectChanges();
  }

  closeDetail() {
    this.selectedNotif = null;
    this.cdr.detectChanges();
  }

  // ===========================
  // منطق التقييم
  // ===========================

  // التحقق إذا كان إشعار تقييم
  isReviewNotif(n: any): boolean {
    return n?.message?.includes('|REVIEW|');
  }

  // استخراج النص المعروض للمستخدم (بدون الـ metadata)
  getDisplayMessage(n: any): string {
    if (!n?.message) return '';
    return n.message.split('|REVIEW|')[0];
  }

  // فتح فورم التقييم من الإشعار
  openReviewFromNotif(n: any) {
    const msg = n.message as string;
    // استخراج bookingId وpropertyId
    const bookingMatch = msg.match(/bookingId:(\d+)/);
    const propertyMatch = msg.match(/propertyId:(\d+)/);

    if (!bookingMatch || !propertyMatch) {
      // fallback — افتح كإشعار عادي
      this.selectedNotif = n;
      this.cdr.detectChanges();
      return;
    }

    this.reviewBookingId = +bookingMatch[1];
    this.reviewPropertyId = +propertyMatch[1];
    this.reviewPropertyName = msg.split('|REVIEW|')[0]
      .replace('قيّم تجربتك في ', '').trim();
    this.reviewRating = 0;
    this.reviewHoverRating = 0;
    this.reviewComment = '';
    this.reviewSuccess = '';
    this.reviewError = '';
    this.showReviewModal = true;
    this.cdr.detectChanges();
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.reviewBookingId = null;
    this.reviewPropertyId = null;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.cdr.detectChanges();
  }

  setRating(r: number) {
    this.reviewRating = r;
    this.cdr.detectChanges();
  }

  submitReview() {
    if (!this.reviewRating) {
      this.reviewError = 'الرجاء اختيار تقييم من 1 إلى 5 نجوم';
      return;
    }

    this.reviewLoading = true;
    this.reviewError = '';

    const payload = {
      bookingId: this.reviewBookingId,
      rating: this.reviewRating,
      comment: this.reviewComment || null
    };

    this.http.post(`${this.url}/reviews`, payload, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.reviewLoading = false;
        this.reviewSuccess = 'شكراً! تم إرسال تقييمك بنجاح ⭐';
        this.toast.show('تم إرسال تقييمك بنجاح!', 'success');
        this.cdr.detectChanges();
        setTimeout(() => this.closeReviewModal(), 2000);
      },
      error: (err) => {
        this.reviewLoading = false;
        this.reviewError = err.error?.message || 'حدث خطأ أثناء إرسال التقييم';
        this.cdr.detectChanges();
      }
    });
  }

  getStars(count: number): number[] { return Array(count).fill(0); }
  getEmptyStars(count: number): number[] { return Array(5 - count).fill(0); }

  getRatingLabel(r: number): string {
    const labels: Record<number, string> = {
      1: '😞 سيئ جداً',
      2: '😕 سيئ',
      3: '😐 مقبول',
      4: '😊 جيد',
      5: '🤩 ممتاز!'
    };
    return labels[r] || '';
  }
}