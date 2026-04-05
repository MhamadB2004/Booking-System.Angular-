import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../services/property';
import { BookingService } from '../../services/booking';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetailsComponent implements OnInit {
  property: any = null;
  loading = true;
  error = '';
  bookingSuccess = '';
  bookingError = '';
  isLoggedIn = false;
  role = '';

  booking = {
    checkIn: '',
    checkOut: '',
    guestsCount: 1,
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private bookingService: BookingService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.role = this.auth.getRole();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProperty(+id);
  }

  loadProperty(id: number) {
    this.propertyService.getById(id).subscribe({
      next: (res) => {
        this.property = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'العقار غير موجود';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  book() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.booking.checkIn || !this.booking.checkOut) {
      this.bookingError = 'الرجاء تحديد تاريخ الوصول والمغادرة';
      return;
    }

    this.bookingError = '';
    this.bookingSuccess = '';

    this.bookingService.create({
      propertyId: this.property.id,
      checkIn: this.booking.checkIn,
      checkOut: this.booking.checkOut,
      guestsCount: this.booking.guestsCount,
      notes: this.booking.notes
    }).subscribe({
      next: (res: any) => {
        this.bookingSuccess = `تم إرسال طلب الحجز بنجاح! ${res.nights} ليالي — ${res.totalPrice} ريال`;
        this.booking = { checkIn: '', checkOut: '', guestsCount: 1, notes: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bookingError = err.error?.message || err.error || 'حدث خطأ أثناء الحجز';
        this.cdr.detectChanges();
      }
    });
  }

  get nights(): number {
    if (!this.booking.checkIn || !this.booking.checkOut) return 0;
    const diff = new Date(this.booking.checkOut).getTime() -
                 new Date(this.booking.checkIn).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  get totalPrice(): number {
    return this.nights * (this.property?.pricePerNight || 0);
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
}