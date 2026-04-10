import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  url = 'https://localhost:7167/api';
  booking: any = null;
  loading = true;
  paying = false;
  success = false;
  error = '';
  method = 'Card';
  transactionRef = '';

  // بيانات البطاقة الوهمية
  card = {
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) this.loadBooking(+bookingId);
  }

  getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

  loadBooking(id: number) {
    this.http.get<any[]>(`${this.url}/bookings/my`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.booking = res.find((b: any) => b.id === id);
        if (!this.booking) {
          this.error = 'الحجز غير موجود';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'حدث خطأ في تحميل الحجز';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  pay() {
    // تحقق من البيانات
    if (this.method === 'Card') {
      if (!this.card.name || !this.card.number ||
          !this.card.expiry || !this.card.cvv) {
        this.error = 'الرجاء تعبئة بيانات البطاقة كاملة';
        return;
      }
    }

    this.paying = true;
    this.error = '';

    // محاكاة تأخير الدفع الحقيقي
    setTimeout(() => {
      this.http.post<any>(`${this.url}/payments`, {
        bookingId: this.booking.id,
        method: this.method
      }, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          this.success = true;
          this.transactionRef = res.transactionRef;
          this.paying = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.message || err.error || 'حدث خطأ أثناء الدفع';
          this.paying = false;
          this.cdr.detectChanges();
        }
      });
    }, 2000); // تأخير 2 ثانية محاكاة
  }

  goToBookings() {
    this.router.navigate(['/my-bookings']);
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    this.card.number = value;
  }

  formatExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.card.expiry = value;
  }
}