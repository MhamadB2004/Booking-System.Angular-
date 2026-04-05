import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking';
import { PaymentService } from '../../services/payment';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];
  loading = true;
  error = '';
  payingId: number | null = null;
  cancellingId: number | null = null;

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.loading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (res: any) => {
        this.bookings = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'لا توجد حجوزات';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

pay(bookingId: number) {
  this.payingId = bookingId;
  this.paymentService.pay({ bookingId, method: 'Card' }).subscribe({
    next: (res: any) => {
      alert(`تم الدفع بنجاح! رقم العملية: ${res.transactionRef}`);
      // حدّث الحجز مباشرة بالـ Array
      const booking = this.bookings.find(b => b.id === bookingId);
      if (booking) booking.status = 'Completed';
      this.payingId = null;
      this.cdr.detectChanges();
    },
    error: (err) => {
      alert(err.error?.message || err.error || 'حدث خطأ أثناء الدفع');
      this.payingId = null;
      this.cdr.detectChanges();
    }
  });
}

cancel(bookingId: number) {
  if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return;
  this.cancellingId = bookingId;
  this.bookingService.cancel(bookingId).subscribe({
    next: () => {
      // حدّث الحجز مباشرة بالـ Array بدون ما ترجع للـ API
      const booking = this.bookings.find(b => b.id === bookingId);
      if (booking) booking.status = 'Cancelled';
      this.cancellingId = null;
      this.cdr.detectChanges();
    },
    error: (err) => {
      alert(err.error?.message || 'حدث خطأ أثناء الإلغاء');
      this.cancellingId = null;
      this.cdr.detectChanges();
    }
  });
}

  getStatusClass(status: string): string {
    switch(status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Confirmed': return 'مؤكد';
      case 'Pending': return 'قيد الانتظار';
      case 'Cancelled': return 'ملغي';
      case 'Completed': return 'مكتمل';
      default: return status;
    }
  }

  goToProperty(title: string) {
    this.router.navigate(['/properties']);
  }
}