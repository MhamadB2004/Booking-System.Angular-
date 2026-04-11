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
  const booking = this.bookings.find(b => b.id === bookingId);

  // تحقق إذا دافع
  if (booking?.status === 'Confirmed') {
    const checkIn = new Date(booking.checkIn);
    const hoursLeft = (checkIn.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursLeft >= 24) {
      // دافع وبقي أكثر من 24 ساعة — استرداد مع خصم 5%
      const deduction = booking.totalPrice * 0.05;
      const refund = booking.totalPrice - deduction;

      const confirmed = confirm(
        `تنبيه: سيتم خصم 5% رسوم إلغاء\n\n` +
        `المبلغ الكلي: ${booking.totalPrice} ريال\n` +
        `رسوم الإلغاء (5%): ${deduction.toFixed(2)} ريال\n` +
        `المبلغ المسترد: ${refund.toFixed(2)} ريال\n\n` +
        `هل تريد المتابعة؟`
      );
      if (!confirmed) return;
    } else if (hoursLeft < 24 && hoursLeft > 0) {
      // أقل من 24 ساعة — لا إلغاء
      alert('❌ لا يمكن إلغاء الحجز — تبقى أقل من 24 ساعة على موعد الوصول');
      return;
    }
  } else {
    if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return;
  }

  this.cancellingId = bookingId;
  this.bookingService.cancel(bookingId).subscribe({
    next: (res: any) => {
      const b = this.bookings.find(b => b.id === bookingId);
      if (b) b.status = 'Cancelled';
      this.cancellingId = null;
      if (res?.refundMessage) alert('✅ ' + res.refundMessage);
      this.cdr.detectChanges();
    },
    error: (err) => {
      alert('❌ ' + (err.error?.message || err.error || 'حدث خطأ'));
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

  goToPayment(bookingId: number) {
  this.router.navigate(['/payment', bookingId]);
}
}