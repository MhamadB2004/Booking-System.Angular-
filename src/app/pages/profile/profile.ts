import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  url = 'https://localhost:7167/api';
  user: any = null;
  loading = true;
  activeTab = 'info';

  profileForm = { fullName: '', email: '', phone: '' };
  profileSuccess = '';
  profileError = '';
  profileLoading = false;

  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordSuccess = '';
  passwordError = '';
  passwordLoading = false;

  profileStats: any = null;
  isTrustedCustomer = false;
  isPremiumCustomer = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  getHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
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
        this.loadProfileStats();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  loadProfileStats() {
    const role = this.user?.role;

    if (role === 'Customer') {
      this.http.get<any[]>(`${this.url}/bookings/my`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (bookings) => {
          const completed = bookings.filter((b: any) => b.status === 'Completed').length;
          const totalSpent = bookings
            .filter((b: any) => b.status === 'Completed' || b.status === 'Confirmed')
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

          this.profileStats = {
            totalBookings: bookings.length,
            completedBookings: completed,
            totalSpent
          };
          this.isTrustedCustomer = completed >= 3;
          this.isPremiumCustomer = completed >= 5;
          this.cdr.detectChanges();
        },
        error: () => {
          this.profileStats = { totalBookings: 0, completedBookings: 0, totalSpent: 0 };
          this.isTrustedCustomer = false;
          this.isPremiumCustomer = false;
          this.cdr.detectChanges();
        }
      });
    } else if (role === 'Owner') {
      this.http.get<any>(`${this.url}/owner/stats`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (stats) => {
          this.profileStats = {
            totalRevenue: stats.totalRevenue || 0,
            activeProperties: stats.activeProperties || 0,
            totalProperties: stats.totalProperties || 0,
            confirmedBookings: stats.confirmedBookings || 0,
            averageRating: stats.averageRating || 0
          };
          this.cdr.detectChanges();
        },
        error: () => {
          this.profileStats = {
            totalRevenue: 0, activeProperties: 0,
            totalProperties: 0, confirmedBookings: 0, averageRating: 0
          };
          this.cdr.detectChanges();
        }
      });
    } else if (role === 'Admin') {
      this.http.get<any>(`${this.url}/admin/stats`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (stats) => {
          this.profileStats = {
            totalUsers: (stats.users?.totalCustomers || 0) + (stats.users?.totalOwners || 0),
            approvedProperties: stats.properties?.approved || 0,
            totalRevenue: stats.revenue?.total || 0,
            totalBookings: stats.bookings?.total || 0
          };
          this.cdr.detectChanges();
        },
        error: () => {
          this.profileStats = {
            totalUsers: 0, approvedProperties: 0,
            totalRevenue: 0, totalBookings: 0
          };
          this.cdr.detectChanges();
        }
      });
    }
  }

  updateProfile() {
    this.profileError = '';
    this.profileSuccess = '';

    if (!this.profileForm.fullName || !this.profileForm.email || !this.profileForm.phone) {
      this.toast.show('الرجاء تعبئة جميع الحقول', 'error');
      return;
    }

    this.profileLoading = true;
    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.user = {
          ...this.user,
          fullName: this.profileForm.fullName,
          email: this.profileForm.email,
          phone: this.profileForm.phone
        };

        const currentUser = this.auth.getUser();
        this.auth.saveToken(this.auth.getToken()!, {
          ...currentUser,
          fullName: this.profileForm.fullName,
          email: this.profileForm.email,
          phone: this.profileForm.phone
        });

        this.profileLoading = false;
        this.toast.show('تم تحديث البيانات بنجاح!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'حدث خطأ أثناء التحديث';
        this.toast.show(msg, 'error');
        this.profileLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.toast.show('الرجاء تعبئة جميع الحقول', 'error');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toast.show('كلمة المرور الجديدة غير متطابقة', 'error');
      return;
    }

    if (this.passwordForm.newPassword.length < 4) {
      this.toast.show('كلمة المرور قصيرة جداً', 'error');
      return;
    }

    this.passwordLoading = true;
    this.auth.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.toast.show('تم تغيير كلمة المرور بنجاح!', 'success');
        this.passwordLoading = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'كلمة المرور الحالية غير صحيحة';
        this.toast.show(msg, 'error');
        this.passwordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStarArray(rating: number): string[] {
    const stars: string[] = [];
    const rounded = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rounded)) stars.push('full');
      else if (i === Math.ceil(rounded) && rounded % 1 !== 0) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  getRoleLabel() {
    switch (this.user?.role) {
      case 'Customer': return 'زبون';
      case 'Owner': return 'مالك';
      case 'Admin': return 'أدمن';
      default: return '';
    }
  }

  getRoleIcon() {
    switch (this.user?.role) {
      case 'Customer': return 'bi-person';
      case 'Owner': return 'bi-house';
      case 'Admin': return 'bi-shield-check';
      default: return 'bi-person';
    }
  }
}