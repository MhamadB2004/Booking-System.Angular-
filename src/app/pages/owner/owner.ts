import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';
import { PropertyService } from '../../services/property';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './owner.html',
  styleUrl: './owner.css'
})
export class OwnerComponent implements OnInit {
  activeTab = 'properties';
  url = 'https://localhost:7167/api';

  properties: any[] = [];
  bookings: any[] = [];
  loading = false;

  propertyFilter = '';
  propertyTypeFilter = '';
  bookingFilter = '';
  bookingStatusFilter = '';

  newProperty: any = {
    title: '', description: '', type: '',
    pricePerNight: null, location: '',
    latitude: null, longitude: null, maxGuests: 1
  };

  addLoading = false;

  editProperty: any = null;
  editSuccess = '';
  editError = '';
  editLoading = false;

  stats = {
    confirmedBookings: 0,
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  };

  notifications: any[] = [];
  unreadCount = 0;
  selectedNotif: any = null;

  reviews: any[] = [];

  calendar: any[] = [];
  selectedMonth: Date = new Date();
  calendarBookings: any[] = [];

  showImageModal = false;
  selectedPropertyForImages: any = null;
  selectedFiles: File[] = [];
  previews: string[] = [];
  uploading = false;
  uploadError = '';
  uploadSuccess = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (this.auth.getRole() !== 'Owner') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadProperties();
    this.loadStats();

    // ✅ قراءة queryParam tab لتوجيه صحيح من صفحة البروفايل
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.setTab(tab);
      }
    });
  }

  getHeaders() {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.editSuccess = '';
    this.editError = '';
    if (tab !== 'edit-property') this.editProperty = null;
    if (tab === 'properties') this.loadProperties();
    else if (tab === 'bookings' || tab === 'pending-bookings' || tab === 'cash-requests') this.loadBookings();
    else if (tab === 'notifications') this.loadNotifications();
    else if (tab === 'reviews') this.loadReviews();
    else if (tab === 'calendar') {
      if (this.bookings.length === 0) {
        this.loadBookings();
        setTimeout(() => { this.loadCalendar(); }, 500);
      } else {
        this.loadCalendar();
      }
    }
  }

  // ===========================
  // ✅ Star Rating Helper
  // ===========================
  getStarArray(rating: number): string[] {
    if (!rating || rating <= 0) return Array(5).fill('empty');
    const clamped = Math.max(0, Math.min(5, rating));
    const rounded = Math.round(clamped * 2) / 2;
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rounded)) stars.push('full');
      else if (i === Math.ceil(rounded) && rounded % 1 !== 0) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  getStarClass(type: string): string {
    switch (type) {
      case 'full': return 'bi bi-star-fill';
      case 'half': return 'bi bi-star-half';
      case 'empty': return 'bi bi-star';
      default: return 'bi bi-star';
    }
  }

  // ===========================
  // العقارات
  // ===========================
  loadProperties() {
    this.loading = true;
    this.http.get<any[]>(`${this.url}/properties/my`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.properties = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.properties = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStats() {
    this.http.get<any>(`${this.url}/owner/stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  get filteredProperties() {
    return this.properties.filter(p => {
      const matchText =
        p.title?.toLowerCase().includes(this.propertyFilter.toLowerCase()) ||
        p.location?.toLowerCase().includes(this.propertyFilter.toLowerCase());
      const matchType = !this.propertyTypeFilter ||
        p.type?.toLowerCase() === this.propertyTypeFilter.toLowerCase();
      return matchText && matchType;
    });
  }

  addProperty() {
    if (!this.newProperty.title || !this.newProperty.type ||
        !this.newProperty.pricePerNight || !this.newProperty.location) {
      this.toast.show('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }

    this.addLoading = true;
    this.http.post<any>(`${this.url}/properties`, this.newProperty, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.toast.show('تم إرسال طلب إضافة العقار — ينتظر موافقة الأدمن ✅', 'success');
        this.addLoading = false;
        this.newProperty = {
          title: '', description: '', type: '',
          pricePerNight: null, location: '',
          latitude: null, longitude: null, maxGuests: 1
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.show(err.error || 'حدث خطأ أثناء الإضافة', 'error');
        this.addLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectEdit(p: any) {
    this.editProperty = { ...p };
    this.activeTab = 'edit-property';
    this.editSuccess = '';
    this.editError = '';
    this.cdr.detectChanges();
  }

  updateProperty() {
    if (!this.editProperty.title || !this.editProperty.type ||
        !this.editProperty.pricePerNight || !this.editProperty.location) {
      this.toast.show('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }

    this.editLoading = true;
    this.http.put(`${this.url}/properties/${this.editProperty.id}`,
      this.editProperty, {
        headers: this.getHeaders(),
        responseType: 'text' as 'json'
      }).subscribe({
      next: () => {
        this.toast.show('تم تحديث العقار بنجاح!', 'success');
        this.editLoading = false;
        this.loadProperties();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.show(err.error || 'حدث خطأ أثناء التعديل', 'error');
        this.editLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteProperty(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) return;
    this.http.delete(`${this.url}/properties/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        this.properties = this.properties.filter(p => p.id !== id);
        this.toast.show('تم حذف العقار بنجاح', 'success');
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('حدث خطأ أثناء الحذف', 'error')
    });
  }

  // ===========================
  // الحجوزات
  // ===========================
  loadBookings() {
    this.loading = true;
    const requests = this.properties.map(p =>
      this.http.get<any[]>(`${this.url}/bookings/property/${p.id}`, {
        headers: this.getHeaders()
      }).toPromise()
    );

    Promise.all(requests).then(results => {
      this.bookings = results
        .filter(r => r)
        .flat()
        .sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get filteredBookings() {
    return this.bookings.filter(b => {
      const matchText = b.propertyTitle?.toLowerCase().includes(this.bookingFilter.toLowerCase());
      const matchStatus = !this.bookingStatusFilter || b.status === this.bookingStatusFilter;
      return matchText && matchStatus;
    });
  }

  get pendingBookings() {
    return this.bookings.filter(b => b.status === 'Pending');
  }

  get pendingCashBookings() {
    return this.bookings.filter(b =>
      b.paymentStatus === 'PendingCash' && b.status === 'Confirmed'
    );
  }

  confirmBooking(id: number) {
    this.http.patch(`${this.url}/bookings/${id}/confirm`, {}, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        const b = this.bookings.find(b => b.id === id);
        if (b) b.status = 'Confirmed';
        this.toast.show('تم تأكيد الحجز بنجاح ✅', 'success');
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('حدث خطأ أثناء التأكيد', 'error')
    });
  }

  confirmCash(bookingId: number) {
    if (!confirm('هل تأكدت من استلام الدفعة النقدية من الزبون؟')) return;
    this.http.patch(`${this.url}/bookings/${bookingId}/confirm-cash`, {}, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        const b = this.bookings.find(b => b.id === bookingId);
        if (b) b.paymentStatus = 'Paid';
        this.toast.show(
          `✅ تم تأكيد الكاش! كود الدخول أُرسل للزبون: ${res.entryCode}`,
          'success'
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'حدث خطأ أثناء التأكيد', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cancelBooking(id: number) {
    if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return;
    this.http.patch(`${this.url}/bookings/${id}/cancel`, {}, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        const b = this.bookings.find(b => b.id === id);
        if (b) b.status = 'Cancelled';
        this.toast.show('تم إلغاء الحجز', 'warning');
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('حدث خطأ أثناء الإلغاء', 'error')
    });
  }

  getStatusLabel(status: string) {
    switch (status) {
      case 'Confirmed': return 'مؤكد';
      case 'Pending': return 'معلق';
      case 'Cancelled': return 'ملغي';
      case 'Completed': return 'مكتمل';
      default: return status;
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  }

  toggleProperty(id: number, currentStatus: boolean) {
    this.http.patch(`${this.url}/properties/${id}/toggle`, {}, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        const p = this.properties.find(p => p.id === id);
        if (p) p.isAvailable = !currentStatus;
        this.toast.show(
          currentStatus ? 'تم إيقاف العقار' : 'تم تفعيل العقار',
          'info'
        );
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('حدث خطأ', 'error')
    });
  }

  // ===========================
  // الإشعارات
  // ===========================
  loadNotifications() {
    this.loading = true;
    this.http.get<any>(`${this.url}/notifications`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.notifications = res.notifications || [];
        this.unreadCount = res.unreadCount || 0;
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
        if (n) { n.isRead = true; this.unreadCount--; }
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
        this.cdr.detectChanges();
      }
    });
  }

  showNotifDetail(n: any) {
    if (!n.isRead) this.markAsRead(n.id);
    this.selectedNotif = n;
    this.cdr.detectChanges();
  }

  closeNotifDetail() {
    this.selectedNotif = null;
    this.cdr.detectChanges();
  }

  // ===========================
  // التقييمات
  // ===========================
  loadReviews() {
    this.loading = true;
    this.http.get<any[]>(`${this.url}/owner/reviews`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.reviews = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  // ===========================
  // تقويم الحجوزات
  // ===========================
  loadCalendar() {
    this.loading = true;
    this.calendarBookings = this.bookings.filter(
      b => b.status === 'Confirmed' || b.status === 'Pending'
    );
    this.generateCalendar();
    this.loading = false;
    this.cdr.detectChanges();
  }

  generateCalendar() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendar = [];
    for (let i = 0; i < firstDay; i++) {
      this.calendar.push({ day: null, bookings: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayBookings = this.calendarBookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        return date >= checkIn && date < checkOut;
      });
      this.calendar.push({ day: d, date, bookings: dayBookings });
    }
  }

  prevMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1, 1
    );
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  nextMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1, 1
    );
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  get monthName(): string {
    return this.selectedMonth.toLocaleDateString('ar', {
      month: 'long', year: 'numeric'
    });
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() &&
      this.selectedMonth.getMonth() === today.getMonth() &&
      this.selectedMonth.getFullYear() === today.getFullYear();
  }

  // ===========================
  // الصور
  // ===========================
  openImageUpload(property: any) {
    this.selectedPropertyForImages = { ...property };
    this.showImageModal = true;
    this.selectedFiles = [];
    this.previews = [];
    this.uploadError = '';
    this.uploadSuccess = '';
    this.cdr.detectChanges();
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 50);
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedPropertyForImages = null;
    this.selectedFiles = [];
    this.previews = [];
    this.cdr.detectChanges();
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    this.addFiles(Array.from(files));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    this.addFiles(files);
  }

  addFiles(files: File[]) {
    this.uploadError = '';
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = `الصورة ${file.name} تتجاوز 5MB`;
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.uploadError = `نوع الملف غير مسموح: ${file.name}`;
        return;
      }
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previews.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
    this.cdr.detectChanges();
  }

  uploadImages() {
    if (!this.selectedPropertyForImages || this.selectedFiles.length === 0) return;

    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    this.propertyService.uploadImages(
      this.selectedPropertyForImages.id,
      this.selectedFiles
    ).subscribe({
      next: (res: any) => {
        this.uploadSuccess = res.message;
        this.uploading = false;
        this.selectedFiles = [];
        this.previews = [];
        const property = this.properties.find(
          p => p.id === this.selectedPropertyForImages.id
        );
        if (property) {
          property.images = [...(property.images || []), ...res.images];
          this.selectedPropertyForImages.images = property.images;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadError = err.error || 'حدث خطأ أثناء الرفع';
        this.uploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteImage(imageUrl: string, index: number) {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    this.selectedPropertyForImages.images.splice(index, 1);
    const property = this.properties.find(
      p => p.id === this.selectedPropertyForImages.id
    );
    if (property) property.images = [...this.selectedPropertyForImages.images];
    this.cdr.detectChanges();
  }

  setMainImage(imageUrl: string, index: number) {
    const images = [...this.selectedPropertyForImages.images];
    images.splice(index, 1);
    images.unshift(imageUrl);
    this.selectedPropertyForImages.images = images;
    const property = this.properties.find(
      p => p.id === this.selectedPropertyForImages.id
    );
    if (property) property.images = images;
    this.cdr.detectChanges();
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://localhost:7167${url}`;
  }
}