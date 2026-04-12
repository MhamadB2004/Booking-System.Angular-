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
  // إذا كانت URL خارجية (unsplash مثلاً) ارجعها كما هي
  if (url.startsWith('http')) return url;
  // إذا كانت local أضيف الـ API URL
  return `https://localhost:7167${url}`;
}
}