import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private count = new BehaviorSubject<number>(0);
  count$ = this.count.asObservable();

  setCount(n: number) {
    this.count.next(n);
  }

  decrement() {
    const current = this.count.getValue();
    if (current > 0) this.count.next(current - 1);
  }

  reset() {
    this.count.next(0);
  }
}