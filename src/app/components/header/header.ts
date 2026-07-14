import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NotificationStateService } from '../../services/notification-state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isLoggedIn = false;
  role = '';
  unreadCount = 0;
  url = 'https://localhost:7167/api';
  menuOpen = false; 
  private sub: Subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notifState: NotificationStateService
  ) {}

  ngOnInit() {
    this.updateState();

    this.sub.add(
      this.notifState.count$.subscribe(count => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      })
    );

    //  أغلق المنيو عند التنقل
    this.sub.add(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe(() => {
        this.menuOpen = false;
        this.updateState();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  //  أغلق المنيو عند الضغط خارجه
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-container')) {
      this.menuOpen = false;
      this.cdr.detectChanges();
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.cdr.detectChanges();
  }

  updateState() {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.role = this.auth.getRole();
    if (this.isLoggedIn) this.loadUnread();
    this.cdr.detectChanges();
  }

  getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }

  loadUnread() {
    this.http.get<any>(`${this.url}/notifications`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.notifState.setCount(res.unreadCount || 0);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  logout() {
    this.menuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}