import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { AuthService } from '../../services/auth';
import { HeroComponent } from '../../components/hero/hero';
import { HeaderComponent } from '../../components/header/header';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule,HeroComponent,HeaderComponent],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  properties: any[] = [];
  error = '';
  filters = { type: '', location: '', minPrice: '', maxPrice: '' };

  constructor(
    private propertyService: PropertyService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.propertyService.getAll(this.filters).subscribe({
      next: (res) => this.properties = res,
      error: () => this.error = 'لا توجد عقارات متاحة'
    });
  }

  search() {
    this.loadProperties();
  }

  goToDetails(id: number) {
    this.router.navigate(['/property', id]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}