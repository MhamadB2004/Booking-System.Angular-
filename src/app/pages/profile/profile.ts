import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  loading = true;
  activeTab = 'info';

  // تعديل البيانات
  profileForm = {
    fullName: '',
    email: '',
    phone: ''
  };
  profileSuccess = '';
  profileError = '';
  profileLoading = false;

  // تغيير كلمة المرور
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordSuccess = '';
  passwordError = '';
  passwordLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.auth.getProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.profileForm = {
          fullName: res.fullName,
          email: res.email,
          phone: res.phone
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  updateProfile() {
    this.profileError = '';
    this.profileSuccess = '';

    if (!this.profileForm.fullName || 
        !this.profileForm.email || 
        !this.profileForm.phone) {
      this.profileError = 'الرجاء تعبئة جميع الحقول';
      return;
    }

    this.profileLoading = true;
    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.profileSuccess = 'تم تحديث البيانات بنجاح!';
        this.profileLoading = false;

        // تحديث بيانات الـ localStorage
        const currentUser = this.auth.getUser();
        this.auth.saveToken(this.auth.getToken()!, {
          ...currentUser,
          fullName: this.profileForm.fullName,
          email: this.profileForm.email
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = err.error?.message || 'حدث خطأ أثناء التحديث';
        this.profileLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwordForm.currentPassword || 
        !this.passwordForm.newPassword || 
        !this.passwordForm.confirmPassword) {
      this.passwordError = 'الرجاء تعبئة جميع الحقول';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'كلمة المرور الجديدة غير متطابقة';
      return;
    }

    if (this.passwordForm.newPassword.length < 4) {
      this.passwordError = 'كلمة المرور قصيرة جداً';
      return;
    }

    this.passwordLoading = true;
    this.auth.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.passwordSuccess = 'تم تغيير كلمة المرور بنجاح!';
        this.passwordLoading = false;
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'حدث خطأ';
        this.passwordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRoleLabel() {
    switch(this.user?.role) {
      case 'Customer': return 'زبون';
      case 'Owner': return 'مالك';
      case 'Admin': return 'أدمن';
      default: return '';
    }
  }

  getRoleIcon() {
    switch(this.user?.role) {
      case 'Customer': return 'bi-person';
      case 'Owner': return 'bi-house';
      case 'Admin': return 'bi-shield-check';
      default: return 'bi-person';
    }
  }
}