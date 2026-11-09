import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Order } from '../models/order.model';

/** Opens the "New order" modal from anywhere and tells listening pages when an order was created. */
@Injectable({ providedIn: 'root' })
export class OrderDialogService {
  readonly isOpen = signal(false);
  private readonly createdSubject = new Subject<Order>();
  readonly created$ = this.createdSubject.asObservable();

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  notifyCreated(order: Order): void {
    this.createdSubject.next(order);
  }
}
