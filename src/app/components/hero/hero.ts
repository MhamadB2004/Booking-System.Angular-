import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent {
  filters = {
    location: '',
    type: '',
    minPrice: '',
    maxPrice: ''
  };

  constructor(private router: Router) {}

search() {
  this.router.navigate(['/properties'], {
    queryParams: {
      type: this.filters.type,
      location: this.filters.location,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice
    }
  });
}
}