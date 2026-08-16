import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

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

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  register() {
    if (!this.fullName || !this.email || !this.phone || !this.password) {
      this.toast.show('الرجاء تعبئة جميع الحقول', 'error');
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
          this.toast.show(
            'تم إنشاء حسابك بنجاح! تحقق من إيميلك لتأكيد بريدك الإلكتروني، وانتظر موافقة الأدمن على حسابك 🎉',
            'info'
          );
        } else {
          this.toast.show(
            'تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني واضغط رابط التأكيد قبل تسجيل الدخول 📩',
            'success'
          );
        }
        setTimeout(() => this.router.navigate(['/login']), 3500);
        this.cdr.detectChanges();
      },
      error: (err) => {
        let msg = 'حدث خطأ أثناء التسجيل';

        if (typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error?.errors) {
          const allMessages = Object.values(err.error.errors).flat() as string[];
          msg = allMessages.join(' — ');
        } else if (err.error?.title) {
          msg = err.error.title;
        }

        this.toast.show(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }
}