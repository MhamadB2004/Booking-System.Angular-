import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  isLoggedIn = false;
  role = '';

  constructor(private auth: AuthService) {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.role = this.auth.getRole();
  }

  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}