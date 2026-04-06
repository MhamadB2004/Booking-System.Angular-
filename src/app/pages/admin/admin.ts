import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  activeTab = 'stats';
  url = 'https://localhost:7167/api';

  stats: any = null;
  users: any[] = [];
  properties: any[] = [];
  pendingProperties: any[] = [];
  bookings: any[] = [];

  loading = false;


  owners: any[] = [];
  selectedUser: any = null;
  selectedProperty: any = null;
  showUserModal = false;
  showPropertyModal = false;

  // فلاتر
  userFilter = '';
  ownerFilter = '';
  propertyFilter = '';
  propertyTypeFilter = '';



  newProperty = {
  title: '',
  description: '',
  type: '',
  pricePerNight: null,
  location: '',
  latitude: null,
  longitude: null,
  maxGuests: 1
};

addSuccess = '';
addError = '';
addLoading = false;

pendingOwners: any[] = [];


  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.auth.getRole() !== 'Admin') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadStats();
  }

  getHeaders() {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

setTab(tab: string) {
  this.activeTab = tab;
  this.closeModals();
  if (tab === 'stats') this.loadStats();
  else if (tab === 'users') this.loadUsers();
  else if (tab === 'owners') this.loadOwners();
  else if (tab === 'properties') this.loadProperties();
  else if (tab === 'pending') this.loadPending();
  else if (tab === 'bookings') this.loadBookings();
  else if (tab === 'approve-owners') this.loadPendingOwners();
}
  loadStats() {
    this.loading = true;
    this.http.get<any>(`${this.url}/admin/stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.stats = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  loadUsers() {
    this.loading = true;
    this.http.get<any[]>(`${this.url}/admin/users`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.users = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

loadProperties() {
  this.loading = true;
  this.http.get<any>(`${this.url}/properties?pageSize=100`, {
    headers: this.getHeaders()
  }).subscribe({
    next: (res) => {
      this.properties = res.data || [];
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => { this.loading = false; }
  });
}

  loadPending() {
    this.loading = true;
    this.http.get<any[]>(`${this.url}/admin/properties/pending`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.pendingProperties = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingProperties = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBookings() {
    this.loading = true;
    this.http.get<any[]>(`${this.url}/admin/bookings`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.bookings = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  approveOwner(userId: number) {
    this.http.patch(`${this.url}/auth/approve-owner/${userId}`, {}, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.isApproved = true;
        this.pendingOwners = this.pendingOwners.filter(o => o.id !== userId);
        this.owners = this.owners.map(o =>
          o.id === userId ? { ...o, isApproved: true } : o
        );
        this.cdr.detectChanges();
      },
      error: () => alert('حدث خطأ أثناء الموافقة')
    });
  }

approveProperty(propertyId: number) {
  this.http.patch(`${this.url}/properties/${propertyId}/approve`, {}, {
    headers: this.getHeaders(),
    responseType: 'text' as 'json'
  }).subscribe({
    next: () => {
      this.pendingProperties = this.pendingProperties
        .filter(p => p.id !== propertyId);
      this.cdr.detectChanges();
    },
    error: () => {
      alert('حدث خطأ أثناء الموافقة');
    }
  });
}

  deleteUser(userId: number) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    this.http.delete(`${this.url}/admin/users/${userId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== userId);
        this.cdr.detectChanges();
      }
    });
  }

  deleteProperty(propertyId: number) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) return;
    this.http.delete(`${this.url}/admin/properties/${propertyId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.properties = this.properties.filter(p => p.id !== propertyId);
        this.cdr.detectChanges();
      }
    });
  }

  getRoleLabel(role: string) {
    if (role === 'Admin') return 'أدمن';
    if (role === 'Owner') return 'مالك';
    return 'زبون';
  }

  getStatusLabel(status: string) {
    switch(status) {
      case 'Confirmed': return 'مؤكد';
      case 'Pending': return 'معلق';
      case 'Cancelled': return 'ملغي';
      case 'Completed': return 'مكتمل';
      default: return status;
    }
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  }

  loadOwners() {
  this.loading = true;
  this.http.get<any[]>(`${this.url}/admin/users?role=Owner`, {
    headers: this.getHeaders()
  }).subscribe({
    next: (res) => {
      this.owners = res;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => { this.loading = false; }
  });
}

showUserDetails(user: any) {
  this.selectedUser = user;
  this.showUserModal = true;
  this.cdr.detectChanges();
}

showPropertyDetails(property: any) {
  this.selectedProperty = property;
  this.showPropertyModal = true;
  this.cdr.detectChanges();
}

closeModals() {
  this.showUserModal = false;
  this.showPropertyModal = false;
  this.selectedUser = null;
  this.selectedProperty = null;
  this.cdr.detectChanges();
}

get filteredUsers() {
  return this.users.filter(u =>
    u.fullName?.toLowerCase().includes(this.userFilter.toLowerCase()) ||
    u.email?.toLowerCase().includes(this.userFilter.toLowerCase())
  );
}

get filteredOwners() {
  return this.owners.filter(o =>
    o.fullName?.toLowerCase().includes(this.ownerFilter.toLowerCase()) ||
    o.email?.toLowerCase().includes(this.ownerFilter.toLowerCase())
  );
}

get filteredProperties() {
  return this.properties.filter(p => {
    const matchText = 
      p.title?.toLowerCase().includes(this.propertyFilter.toLowerCase()) ||
      p.location?.toLowerCase().includes(this.propertyFilter.toLowerCase());
    
    const matchType = !this.propertyTypeFilter || 
      p.type?.toLowerCase() === this.propertyTypeFilter.toLowerCase();
    
    return matchText && matchType;
  });
}
addProperty() {
  this.addError = '';
  this.addSuccess = '';

  if (!this.newProperty.title || !this.newProperty.type ||
      !this.newProperty.pricePerNight || !this.newProperty.location) {
    this.addError = 'الرجاء تعبئة جميع الحقول المطلوبة';
    return;
  }

  this.addLoading = true;

  this.http.post(`${this.url}/properties`, this.newProperty, {
    headers: this.getHeaders(),
    responseType: 'text' as 'json'
  }).subscribe({
    next: () => {
      this.addSuccess = 'تم إضافة العقار بنجاح!';
      this.addLoading = false;
      this.newProperty = {
        title: '',
        description: '',
        type: '',
        pricePerNight: null,
        location: '',
        latitude: null,
        longitude: null,
        maxGuests: 1
      };
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.addError = err.error || 'حدث خطأ أثناء الإضافة';
      this.addLoading = false;
      this.cdr.detectChanges();
    }
  });
  }

  loadPendingOwners() {
  this.loading = true;
  this.http.get<any[]>(`${this.url}/admin/users?role=Owner`, {
    headers: this.getHeaders()
  }).subscribe({
    next: (res) => {
      this.pendingOwners = res.filter((u: any) => !u.isApproved);
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => { this.loading = false; }
  });
}

rejectOwner(userId: number) {
  if (!confirm('هل أنت متأكد من رفض هذا المالك؟')) return;
  this.http.delete(`${this.url}/admin/users/${userId}`, {
    headers: this.getHeaders(),
    responseType: 'text' as 'json'
  }).subscribe({
    next: () => {
      this.pendingOwners = this.pendingOwners.filter(o => o.id !== userId);
      this.users = this.users.filter(u => u.id !== userId);
      this.owners = this.owners.filter(o => o.id !== userId);
      this.cdr.detectChanges();
    },
    error: () => alert('حدث خطأ أثناء الرفض')
  });
}
}