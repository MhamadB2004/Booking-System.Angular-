import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';

    
export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent  },   // مؤقت
    { path: 'admin', component: LoginComponent },  // مؤقت
    { path: 'owner', component: LoginComponent },  // مؤقت
];
