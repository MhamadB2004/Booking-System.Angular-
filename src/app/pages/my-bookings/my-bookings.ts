import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking';
import { PaymentService } from '../../services/payment';
import { HeaderComponent } from '../../components/header/header';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];
  loading = true;
  error = '';
  payingId: number | null = null;
  cancellingId: number | null = null;

  // Modal الإلغاء
  showCancelModal = false;
  cancelBookingData: any = null;
  // free = لم يدفع | fullRefund = أكثر من 24 ساعة | withDeduction = أقل من 24 ساعة
  cancelType: 'free' | 'fullRefund' | 'withDeduction' = 'free';
  deductionAmount = 0;
  refundAmount = 0;

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
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

  // فتح Modal الإلغاء مع تحديد النوع
  openCancelModal(bookingId: number) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    this.cancelBookingData = booking;

    const checkIn = new Date(booking.checkIn);
    const hoursLeft = (checkIn.getTime() - Date.now()) / (1000 * 60 * 60);
    const hasPaid = booking.status === 'Confirmed';

    if (!hasPaid) {
      // الحالة 2 — لم يدفع — إلغاء طبيعي بدون خصم
      this.cancelType = 'free';
      this.deductionAmount = 0;
      this.refundAmount = 0;
    } else if (hoursLeft >= 24) {
      // الحالة 1أ — دفع + أكثر من 24 ساعة — استرداد كامل
      this.cancelType = 'fullRefund';
      this.deductionAmount = 0;
      this.refundAmount = booking.totalPrice;
    } else {
      // الحالة 1ب — دفع + أقل من 24 ساعة — خصم 5%
      this.cancelType = 'withDeduction';
      this.deductionAmount = Math.round(booking.totalPrice * 0.05 * 100) / 100;
      this.refundAmount = Math.round((booking.totalPrice - this.deductionAmount) * 100) / 100;
    }

    this.showCancelModal = true;
    this.cdr.detectChanges();
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.cancelBookingData = null;
    this.cdr.detectChanges();
  }

  // تأكيد الإلغاء بعد موافقة المستخدم
  confirmCancel() {
    if (!this.cancelBookingData) return;

    const bookingId = this.cancelBookingData.id;
    this.cancellingId = bookingId;
    this.closeCancelModal();

    this.bookingService.cancel(bookingId).subscribe({
      next: (res: any) => {
        const b = this.bookings.find(b => b.id === bookingId);
        if (b) b.status = 'Cancelled';
        this.cancellingId = null;

        if (res?.refundAmount > 0) {
          this.toast.show(
            `✅ تم الإلغاء — سيتم استرداد ${res.refundAmount} ليرة`,
            'success'
          );
        } else {
          this.toast.show('تم إلغاء الحجز بنجاح ✅', 'success');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.show(
          err.error?.message || 'حدث خطأ أثناء الإلغاء',
          'error'
        );
        this.cancellingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  pay(bookingId: number) {
    this.payingId = bookingId;
    this.paymentService.pay({ bookingId, method: 'Card' }).subscribe({
      next: (res: any) => {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) booking.status = 'Completed';
        this.payingId = null;
        this.toast.show(
          `تم الدفع بنجاح! رقم العملية: ${res.transactionRef}`,
          'success'
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.show(
          err.error?.message || 'حدث خطأ أثناء الدفع',
          'error'
        );
        this.payingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  goToPayment(bookingId: number) {
    this.router.navigate(['/payment', bookingId]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Confirmed': return 'مؤكد';
      case 'Pending': return 'قيد الانتظار';
      case 'Cancelled': return 'ملغي';
      case 'Completed': return 'مكتمل';
      default: return status;
    }
  }
}