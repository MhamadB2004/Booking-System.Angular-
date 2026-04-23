import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
export class PropertyDetailsComponent implements OnInit, OnDestroy {
  property: any = null;
  loading = true;
  error = '';
  bookingSuccess = '';
  bookingError = '';
  isLoggedIn = false;
  role = '';
  // كل review يحتوي على stars[] و emptyStars[] مُحسوبة مسبقاً لمنع الـ flickering
  reviews: any[] = [];
  averageRating = 0;
  totalReviews = 0;
  // نجوم المتوسط العام — مُحسوبة مرة واحدة عند تحميل البيانات
  averageStars: number[] = [];
  averageEmptyStars: number[] = [];
  url = 'https://localhost:7167/api';

  // ===========================
  // Slider State
  // ===========================
  activeSlide = 0;
  private autoplayTimer: any = null;
  private touchStartX = 0;
  private touchEndX = 0;
  readonly AUTOPLAY_DELAY = 5000; // 5 ثوانٍ بين الصور

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
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.role = this.auth.getRole();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(+id);
      this.loadReviews(+id);
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  // ===========================
  // تحميل بيانات العقار
  // ===========================
  loadProperty(id: number) {
    this.propertyService.getById(id).subscribe({
      next: (res) => {
        this.property = res;
        this.loading = false;
        // ابدأ الـ Autoplay بعد تحميل الصور
        if (this.sliderImages.length > 1) {
          this.startAutoplay();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'العقار غير موجود';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReviews(propertyId: number) {
    this.http.get<any>(`${this.url}/reviews/property/${propertyId}`).subscribe({
      next: (res) => {
        this.averageRating = res.averageRating || 0;
        this.totalReviews = res.totalReviews || 0;
        // احسب نجوم المتوسط مرة واحدة
        this.averageStars = Array(Math.floor(this.averageRating)).fill(0);
        this.averageEmptyStars = Array(5 - Math.floor(this.averageRating)).fill(0);
        // احسب نجوم كل تقييم مرة واحدة عند التحميل لمنع الـ flickering
        this.reviews = (res.reviews || []).map((r: any) => ({
          ...r,
          starsArray: Array(Math.floor(r.rating)).fill(0),
          emptyStarsArray: Array(5 - Math.floor(r.rating)).fill(0)
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.averageStars = [];
        this.averageEmptyStars = [];
      }
    });
  }

  // ===========================
  // Slider Logic
  // ===========================

  /**
   * مصفوفة الصور المعالجة — تُرجع URLs كاملة جاهزة للعرض
   */
  get sliderImages(): string[] {
    if (!this.property?.images?.length) return [];
    return this.property.images.map((img: string) => this.getImageUrl(img));
  }

  /**
   * الانتقال للصورة السابقة
   */
  prevSlide() {
    if (this.sliderImages.length <= 1) return;
    this.resetAutoplay();
    this.activeSlide = (this.activeSlide - 1 + this.sliderImages.length) % this.sliderImages.length;
    this.cdr.detectChanges();
  }

  /**
   * الانتقال للصورة التالية
   */
  nextSlide() {
    if (this.sliderImages.length <= 1) return;
    this.resetAutoplay();
    this.activeSlide = (this.activeSlide + 1) % this.sliderImages.length;
    this.cdr.detectChanges();
  }

  /**
   * الانتقال لصورة محددة (عبر Dots أو Thumbnails)
   */
  goToSlide(index: number) {
    if (index === this.activeSlide) return;
    this.resetAutoplay();
    this.activeSlide = index;
    this.cdr.detectChanges();
  }

  // ===========================
  // Autoplay
  // ===========================
  private startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.sliderImages.length;
      this.cdr.detectChanges();
    }, this.AUTOPLAY_DELAY);
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  private resetAutoplay() {
    this.stopAutoplay();
    if (this.sliderImages.length > 1) {
      this.startAutoplay();
    }
  }

  // ===========================
  // Touch / Swipe Support (موبايل)
  // ===========================
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50; // الحد الأدنى للـ Swipe بالبكسل

    if (Math.abs(diff) < threshold) return; // حركة صغيرة جداً — تجاهل

    if (diff > 0) {
      // Swipe يسار → الصورة التالية
      this.nextSlide();
    } else {
      // Swipe يمين → الصورة السابقة
      this.prevSlide();
    }
  }

  // ===========================
  // Keyboard Navigation
  // ===========================
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') this.nextSlide();
    if (event.key === 'ArrowRight') this.prevSlide();
  }

  // ===========================
  // Booking Logic
  // ===========================
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
        this.bookingSuccess = `تم إرسال طلب الحجز بنجاح! ${res.nights} ليالي — ${res.totalPrice} ليرة`;
        this.booking = { checkIn: '', checkOut: '', guestsCount: 1, notes: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bookingError = err.error?.message || err.error || 'حدث خطأ أثناء الحجز';
        this.cdr.detectChanges();
      }
    });
  }

  // ===========================
  // Helpers
  // ===========================
  // هذه الدوال للاستخدام المحلي فقط — التقييمات تستخدم starsArray/emptyStarsArray المحسوبة مسبقاً
  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
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

  getImageUrl(url: string): string {
    if (!url) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200';
    if (url.startsWith('http')) return url;
    return `https://localhost:7167${url}`;
  }
}