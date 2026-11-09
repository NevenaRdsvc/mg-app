import { Component, input } from '@angular/core';
import { OrderStatus } from '../core/models/order.model';

@Component({
  selector: 'om-status-badge',
  template: `<span [class]="'badge badge-' + status().toLowerCase()"><span class="badge-dot"></span>{{ status() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
}
