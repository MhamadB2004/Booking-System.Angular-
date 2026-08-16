import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../services/property';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './properties.html',
  styleUrl: './properties.css'
})
export class PropertiesComponent implements OnInit {
  properties: any[] = [];
  error = '';
  loading = false;
  currentPage = 1;
  totalPages = 1;

  filters = {
    type: '',
    location: '',
    minPrice: '',
    maxPrice: ''
  };

  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.filters.type = params['type'] || '';
      this.filters.location = params['location'] || '';
      this.filters.minPrice = params['minPrice'] || '';
      this.filters.maxPrice = params['maxPrice'] || '';
      this.currentPage = 1;
      this.loadProperties();
    });
  }

  loadProperties() {
    this.loading = true;
    this.error = '';
    this.properties = [];
    this.cdr.detectChanges();

    this.propertyService.getAll(this.filters, this.currentPage).subscribe({
      next: (res: any) => {
        this.properties = [...(res.data || [])];
        this.totalPages = res.totalPages || 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No properties found';
        this.properties = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search() {
    this.currentPage = 1;
    this.loadProperties();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProperties();
    window.scrollTo(0, 0);
  }

  goToDetails(id: number) {
    this.router.navigate(['/property', id]);
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${url}`;
  }

  // ===========================
  //  Half-Star Rating Logic
  // ===========================

  /**
   * يُرجع مصفوفة من 5 عناصر:
   * 'full'  → نجمة كاملة ذهبية
   * 'half'  → نصف نجمة
   * 'empty' → نجمة فارغة
   */
  getStarArray(rating: number): string[] {
    if (!rating || rating <= 0) return Array(5).fill('empty');

    const stars: string[] = [];
    const clamped = Math.max(0, Math.min(5, rating));
    // تقريب لأقرب 0.5
    const rounded = Math.round(clamped * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rounded)) {
        stars.push('full');
      } else if (i === Math.ceil(rounded) && rounded % 1 !== 0) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  /** يُرجع اسم الـ Bootstrap Icon المناسب */
  getStarClass(type: string): string {
    switch (type) {
      case 'full':  return 'bi bi-star-fill';
      case 'half':  return 'bi bi-star-half';
      case 'empty': return 'bi bi-star';
      default:      return 'bi bi-star';
    }
  }

  /** تنسيق التقييم للعرض */
  formatRating(rating: number): string {
    if (!rating || rating <= 0) return 'جديد';
    return rating.toFixed(1);
  }
}