import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent implements OnInit {
  filters = {
    location: '',
    type: '',
    minPrice: '',
    maxPrice: ''
  };

  stats = {
    totalProperties: 0,
    totalOwners: 0,
    satisfaction: 0
  };

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.propertyService.getPublicStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  search() {
    this.router.navigate(['/properties'], {
      queryParams: this.filters
    });
  }
}