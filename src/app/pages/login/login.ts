import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: (res) => {
          this.auth.saveToken(res.token, res.user);
          const role = res.user.role;
          if (role === 'Admin') this.router.navigate(['/admin']);
          else if (role === 'Owner') this.router.navigate(['/owner']);
          else this.router.navigate(['/home']);
        },
        error: () => {
          this.error = 'Invalid email or password. Please try again.';
        }
      });
  }
}