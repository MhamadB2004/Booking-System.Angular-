import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;
  message = '';

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.email) return;

    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.submitted = true;
        this.message = res.message;
      },
      error: () => {
        this.loading = false;
        this.submitted = true;
        this.message = 'إذا كان الإيميل مسجل عندنا، رح توصلك رسالة لإعادة تعيين كلمة السر';
      }
    });
  }
}