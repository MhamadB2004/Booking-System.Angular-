import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  success = false;
  error = '';
  tokenMissing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenMissing = true;
    }
  }

  submit() {
    this.error = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'الرجاء تعبئة الحقول';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'كلمة المرور لازم تكون 6 أحرف عالأقل';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'كلمتا المرور غير متطابقتين';
      return;
    }

    this.loading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'حدث خطأ، جرب مرة تانية';
      }
    });
  }
}