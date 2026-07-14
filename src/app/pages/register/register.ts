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
          //  مالك — ينتظر موافقة
          this.toast.show(
            'تم إنشاء حسابك بنجاح! حسابك قيد المراجعة — سيتم إشعارك عند موافقة الأدمن 🎉',
            'info'
          );
        } else {
          //  زبون — مباشر للـ login
          this.toast.show('تم إنشاء الحساب بنجاح! جاري التحويل...', 'success');
          setTimeout(() => this.router.navigate(['/login']), 2500);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        //  إذا الإيميل مسجل مسبقاً أو أي خطأ
        const msg = err.error || 'حدث خطأ أثناء التسجيل';
        this.toast.show(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }
}