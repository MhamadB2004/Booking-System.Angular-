import { Component, ChangeDetectorRef } from '@angular/core';
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
  showResend = false;
  resendLoading = false;
  resendMessage = '';
  resendCooldown = 0;
  private cooldownInterval: any;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    this.error = '';
    this.showResend = false;
    this.resendMessage = '';

    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: (res) => {
          this.auth.saveToken(res.token, res.user);
          const role = res.user.role;
          if (role === 'Admin') this.router.navigate(['/admin']);
          else if (role === 'Owner') this.router.navigate(['/owner']);
          else this.router.navigate(['/home']);
        },
        error: (err) => {
          // التعامل مع استجابة الخطأ سواء كانت كائن JSON أو نص عادي
          if (typeof err.error === 'string') {
            this.error = err.error;
          } else {
            this.error = err.error?.message || 'الإيميل أو كلمة المرور غلط';
          }

          // إظهار كرت إعادة الإرسال في حال احتوى نص الخطأ على الكلمات الدالة على عدم تأكيد الإيميل
          if (this.error.includes('بريدك') || this.error.includes('تأكيد')) {
            this.showResend = true;
          }

          // نجبر Angular يحدّث الشاشة فوراً، لأن الرد وصل خارج سياق حدث Angular (زر) مباشر
          this.cdr.detectChanges();
        }
      });
  }

  resendVerification() {
    if (!this.email || this.resendLoading || this.resendCooldown > 0) return;

    this.resendLoading = true;
    this.resendMessage = '';
    this.cdr.detectChanges(); // يعرض السبينر فوراً بدل ما ينتظر حدث تاني

    this.auth.resendVerification(this.email).subscribe({
      next: (res: any) => {
        this.resendLoading = false;
        this.resendMessage = res.message;
        this.startCooldown();
        this.cdr.detectChanges();
      },
      error: () => {
        this.resendLoading = false;
        this.resendMessage = 'حدث خطأ، جرب مرة تانية';
        this.startCooldown();
        this.cdr.detectChanges();
      }
    });
  }

  private startCooldown() {
    this.resendCooldown = 30;
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
      this.cdr.detectChanges();
    }, 1000);
  }
}