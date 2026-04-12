import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';
import { PropertyService } from '../../services/property';

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

  // فلاتر
  propertyFilter = '';
  propertyTypeFilter = '';
  bookingFilter = '';
  bookingStatusFilter = '';

  // إضافة عقار
  newProperty: any = {
    title: '', description: '', type: '',
    pricePerNight: null, location: '',
    latitude: null, longitude: null, maxGuests: 1
  };
  addSuccess = '';
  addError = '';
  addLoading = false;

  // تعديل عقار
  editProperty: any = null;
  editSuccess = '';
  editError = '';
  editLoading = false;

    //الإحصائيات السريعة
    stats = {
    confirmedBookings: 0,
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  };

  //الاشعارات 

  notifications: any[] = [];
  unreadCount = 0;

  //التفييمات 

  reviews: any[] = [];


  //تقويم الحجوزات 

  calendar: any[] = [];
  selectedMonth: Date = new Date();
  calendarBookings: any[] = [];


  // للصور 
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
    private http: HttpClient,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnInit() {
    if (this.auth.getRole() !== 'Owner') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadProperties();
    this.loadStats()
  }

  getHeaders() {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.addSuccess = '';
    this.addError = '';
    this.editSuccess = '';
    this.editError = '';
    this.editProperty = null;
    if (tab === 'properties') this.loadProperties();
    else if (tab === 'bookings' || tab === 'pending-bookings') this.loadBookings();
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
    this.addError = '';
    this.addSuccess = '';

    if (!this.newProperty.title || !this.newProperty.type ||
        !this.newProperty.pricePerNight || !this.newProperty.location) {
      this.addError = 'الرجاء تعبئة جميع الحقول المطلوبة';
      return;
    }

    this.addLoading = true;
    this.http.post<any>(`${this.url}/properties`, this.newProperty, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.addSuccess = 'تم إرسال طلب إضافة العقار — ينتظر موافقة الأدمن';
        this.addLoading = false;
        this.newProperty = {
          title: '', description: '', type: '',
          pricePerNight: null, location: '',
          latitude: null, longitude: null, maxGuests: 1
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addError = err.error || 'حدث خطأ أثناء الإضافة';
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
    this.editError = '';
    this.editSuccess = '';

    if (!this.editProperty.title || !this.editProperty.type ||
        !this.editProperty.pricePerNight || !this.editProperty.location) {
      this.editError = 'الرجاء تعبئة جميع الحقول المطلوبة';
      return;
    }

    this.editLoading = true;
    this.http.put(`${this.url}/properties/${this.editProperty.id}`,
      this.editProperty, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        this.editSuccess = 'تم تحديث العقار بنجاح!';
        this.editLoading = false;
        this.loadProperties();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editError = err.error || 'حدث خطأ أثناء التعديل';
        this.editLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteProperty(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) return;
    this.http.delete(`${this.url}/admin/properties/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        this.properties = this.properties.filter(p => p.id !== id);
        this.cdr.detectChanges();
      },
      error: () => alert('حدث خطأ أثناء الحذف')
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
      const matchText =
        b.propertyTitle?.toLowerCase().includes(this.bookingFilter.toLowerCase());
      const matchStatus = !this.bookingStatusFilter ||
        b.status === this.bookingStatusFilter;
      return matchText && matchStatus;
    });
  }

  get pendingBookings() {
    return this.bookings.filter(b => b.status === 'Pending');
  }

  confirmBooking(id: number) {
    this.http.patch(`${this.url}/bookings/${id}/confirm`, {}, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        const b = this.bookings.find(b => b.id === id);
        if (b) b.status = 'Confirmed';
        this.cdr.detectChanges();
      },
      error: () => alert('حدث خطأ أثناء التأكيد')
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
        this.cdr.detectChanges();
      },
      error: () => alert('حدث خطأ أثناء الإلغاء')
    });
  }

  getStatusLabel(status: string) {
    switch(status) {
      case 'Confirmed': return 'مؤكد';
      case 'Pending': return 'معلق';
      case 'Cancelled': return 'ملغي';
      case 'Completed': return 'مكتمل';
      default: return status;
    }
  }

  getStatusClass(status: string) {
    switch(status) {
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
    next: (res: any) => {
      const p = this.properties.find(p => p.id === id);
      if (p) p.isAvailable = !currentStatus;
      this.cdr.detectChanges();
    },
    error: () => alert('حدث خطأ')
  });
}

  //الاشعارات 

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

    //التفييمات 
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

//تقويم الحجوزات 

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

  // أيام فاضية في البداية
  for (let i = 0; i < firstDay; i++) {
    this.calendar.push({ day: null, bookings: [] });
  }

  // أيام الشهر
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

//للصور 

// فتح modal الصور
openImageUpload(property: any) {
  this.selectedPropertyForImages = { ...property };
  this.showImageModal = true;
  this.selectedFiles = [];
  this.previews = [];
  this.uploadError = '';
  this.uploadSuccess = '';
  this.cdr.detectChanges();
}

closeImageModal() {
  this.showImageModal = false;
  this.selectedPropertyForImages = null;
  this.selectedFiles = [];
  this.previews = [];
  this.cdr.detectChanges();
}

// اختيار ملفات
onFilesSelected(event: any) {
  const files: FileList = event.target.files;
  this.addFiles(Array.from(files));
}

// Drag & Drop
onDrop(event: DragEvent) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer?.files || []);
  this.addFiles(files);
}

addFiles(files: File[]) {
  this.uploadError = '';
  
  for (const file of files) {
    // تحقق من الحجم
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = `الصورة ${file.name} تتجاوز 5MB`;
      return;
    }
    
    // تحقق من النوع
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.uploadError = `نوع الملف غير مسموح: ${file.name}`;
      return;
    }

    this.selectedFiles.push(file);

    // معاينة
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

// رفع الصور
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

      // تحديث صور العقار في الـ Array
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

// حذف صورة
deleteImage(imageUrl: string, index: number) {
  if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

  // استخراج الـ imageId من الـ URL — لازم نعدل لاحقاً
  // مؤقتاً نحذفها من الـ Array
  this.selectedPropertyForImages.images.splice(index, 1);
  const property = this.properties.find(
    p => p.id === this.selectedPropertyForImages.id
  );
  if (property) property.images = [...this.selectedPropertyForImages.images];
  this.cdr.detectChanges();
}

// تعيين صورة رئيسية
setMainImage(imageUrl: string, index: number) {
  // نحرك الصورة لأول مكان
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