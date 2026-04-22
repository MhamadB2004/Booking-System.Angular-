import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { PropertyService } from '../../services/property';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent implements OnInit, OnDestroy {

  loadingStats = true;

  // القيم الحقيقية من الـ API
  apiStats = {
    totalProperties: 0,
    totalCustomers: 0,
    satisfaction: 98,
    totalBookings: 0
  };

  // القيم المعروضة (تتحرك بالعداد)
  displayedStats = {
    totalProperties: 0,
    totalCustomers: 0,
    satisfaction: 0,
    totalBookings: 0
  };

  private intervals: any[] = [];

  features = [
    {
      icon: 'bi-house-heart',
      title: 'عقارات متنوعة',
      desc: 'مزارع وشقق بمواقع مميزة تناسب جميع الأذواق والميزانيات'
    },
    {
      icon: 'bi-shield-check',
      title: 'حجز آمن',
      desc: 'نظام دفع آمن ومشفر مع ضمان استرداد الأموال عند الإلغاء'
    },
    {
      icon: 'bi-star',
      title: 'تقييمات موثوقة',
      desc: 'تقييمات حقيقية من زبائن حجزوا وأقاموا بالفعل'
    },
    {
      icon: 'bi-headset',
      title: 'دعم على مدار الساعة',
      desc: 'فريق دعم متاح 24/7 للإجابة على استفساراتك'
    },
    {
      icon: 'bi-person-check',
      title: 'ملاك موثوقون',
      desc: 'جميع الملاك خضعوا للتحقق والموافقة من قِبل فريقنا'
    },
    {
      icon: 'bi-geo-alt',
      title: 'مواقع متميزة',
      desc: 'عقارات في أفضل المواقع مع خرائط تفصيلية للوصول بسهولة'
    }
  ];

  team = [
    { name: 'محمد أحمد', role: 'المدير التنفيذي', avatar: 'م' },
    { name: 'سارة خالد', role: 'مديرة العمليات', avatar: 'س' },
    { name: 'أحمد محمود', role: 'مدير التقنية', avatar: 'أ' }
  ];

  constructor(
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  ngOnDestroy() {
    this.intervals.forEach(i => clearInterval(i));
  }

  loadStats() {
    this.propertyService.getPublicStats().subscribe({
      next: (res) => {
        this.apiStats = {
          totalProperties: res.totalProperties || 0,
          totalCustomers: res.totalCustomers || 0,
          satisfaction: res.satisfaction || 98,
          totalBookings: res.totalBookings || 0
        };
        this.loadingStats = false;
        this.startCounters();
        this.cdr.detectChanges();
      },
      error: () => {
        // قيم افتراضية عند الخطأ
        this.apiStats = { totalProperties: 50, totalCustomers: 200, satisfaction: 98, totalBookings: 150 };
        this.loadingStats = false;
        this.startCounters();
        this.cdr.detectChanges();
      }
    });
  }

  startCounters() {
    this.animateCounter('totalProperties', this.apiStats.totalProperties, 2000);
    this.animateCounter('totalCustomers', this.apiStats.totalCustomers, 2000);
    this.animateCounter('satisfaction', this.apiStats.satisfaction, 1500);
    this.animateCounter('totalBookings', this.apiStats.totalBookings, 1800);
  }

  animateCounter(key: keyof typeof this.displayedStats, target: number, duration = 2000) {
    if (target === 0) {
      this.displayedStats[key] = 0;
      return;
    }
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayedStats[key] = target;
        clearInterval(interval);
      } else {
        this.displayedStats[key] = Math.floor(current);
      }
      this.cdr.detectChanges();
    }, stepTime);

    this.intervals.push(interval);
  }
}