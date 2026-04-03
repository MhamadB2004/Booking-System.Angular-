import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { authGuard } from './guards/auth-guard';
import { RegisterComponent } from './pages/register/register';
import { PropertiesComponent } from './pages/properties/properties';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'admin', component: LoginComponent, canActivate: [authGuard] },
  { path: 'owner', component: LoginComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'properties', component: PropertiesComponent, canActivate: [authGuard] },

];