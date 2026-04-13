import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { authGuard } from './guards/auth-guard';
import { RegisterComponent } from './pages/register/register';
import { PropertiesComponent } from './pages/properties/properties';
import { PropertyDetailsComponent } from './pages/property-details/property-details';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings';
import { AdminComponent } from './pages/admin/admin';
import { OwnerComponent } from './pages/owner/owner';
import { PaymentComponent } from './pages/payment/payment';
import { NotificationsComponent } from './pages/notifications/notifications';
import { AboutComponent } from './pages/about/about';
import { ProfileComponent } from './pages/profile/profile';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },

  //   بدون authGuard — متاح للجميع
  { path: 'home', component: HomeComponent },
  { path: 'properties', component: PropertiesComponent },
  { path: 'property/:id', component: PropertyDetailsComponent },

  //   تحتاج تسجيل دخول
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [authGuard] },
  { path: 'payment/:id', component: PaymentComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'owner', component: OwnerComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
];