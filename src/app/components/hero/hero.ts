import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  filters = {
    location: '',
    type: '',
    minPrice: '',
    maxPrice: ''
  };

  // القيم الحقيقية من الـ API
  stats = {
    totalProperties: 0,
    totalOwners: 0,
    totalBookings: 0,
    satisfaction: 0
  };

  // القيم المعروضة (تتحرك بالعداد)
  displayed = {
    totalProperties: 0,
    totalOwners: 0,
    totalBookings: 0,
    satisfaction: 0
  };

  // بيانات القسم الثاني (ثابتة + من API)
  aboutStats = {
    properties: 0,
    successRate: 95,
    support: 24,
    awardsWon: 12
  };

  displayedAbout = {
    properties: 0,
    successRate: 0,
    support: 0,
    awardsWon: 0
  };

  private intervals: any[] = [];

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.propertyService.getPublicStats().subscribe({
      next: (res) => {
        this.stats = {
          totalProperties: res.totalProperties || 0,
          totalOwners: res.totalOwners || 0,
          totalBookings: res.totalBookings || 0,
          satisfaction: res.satisfaction || 98
        };
        this.aboutStats.properties = res.totalProperties || 0;

        // ابدأ العدادات بعد تحميل البيانات
        this.startCounters();
        this.cdr.detectChanges();
      },
      error: () => {
        // قيم افتراضية لو فشل الـ API
        this.stats = { totalProperties: 10, totalOwners: 5, totalBookings: 20, satisfaction: 98 };
        this.aboutStats.properties = 10;
        this.startCounters();
      }
    });
  }

  ngOnDestroy() {
    this.intervals.forEach(i => clearInterval(i));
  }

  // دالة العداد المتحرك
  animateCounter(
    key: keyof typeof this.displayed,
    target: number,
    duration = 2000
  ) {
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayed[key] = target;
        clearInterval(interval);
      } else {
        this.displayed[key] = Math.floor(current);
      }
      this.cdr.detectChanges();
    }, stepTime);

    this.intervals.push(interval);
  }

  animateAboutCounter(
    key: keyof typeof this.displayedAbout,
    target: number,
    duration = 2000
  ) {
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayedAbout[key] = target;
        clearInterval(interval);
      } else {
        this.displayedAbout[key] = Math.floor(current);
      }
      this.cdr.detectChanges();
    }, stepTime);

    this.intervals.push(interval);
  }

  startCounters() {
    // عدادات الـ Hero
    this.animateCounter('totalProperties', this.stats.totalProperties, 2000);
    this.animateCounter('totalOwners', this.stats.totalOwners, 2000);
    this.animateCounter('totalBookings', this.stats.totalBookings, 2000);
    this.animateCounter('satisfaction', this.stats.satisfaction, 1500);

    // عدادات قسم About
    this.animateAboutCounter('properties', this.aboutStats.properties, 2000);
    this.animateAboutCounter('successRate', this.aboutStats.successRate, 1500);
    this.animateAboutCounter('support', this.aboutStats.support, 1000);
    this.animateAboutCounter('awardsWon', this.aboutStats.awardsWon, 1200);
  }

  search() {
    this.router.navigate(['/properties'], {
      queryParams: this.filters
    });
  }
}