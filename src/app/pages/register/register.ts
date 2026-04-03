import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  role = 'Customer';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.error = '';
    this.success = '';

    if (!this.fullName || !this.email || !this.phone || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.auth.register({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res: any) => {
        if (res.needsApproval) {
          this.success = 'Account created! Please wait for admin approval.';
        } else {
          this.success = 'Account created successfully! Redirecting...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        }
      },
      error: (err) => {
        this.error = err.error || 'Registration failed. Please try again.';
      }
    });
  }
}