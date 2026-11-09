import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NEXT_STATUSES, Order, OrderStatus } from '../../../core/models/order.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessages } from '../../../core/utils/api-error';
import { Avatar } from '../../../shared/avatar';
import { EmptyState } from '../../../shared/empty-state';
import { Icon } from '../../../shared/icon';
import { SkeletonRows } from '../../../shared/skeleton-rows';
import { StatusBadge } from '../../../shared/status-badge';

const STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  Confirmed: 'Confirm order',
  Shipped: 'Mark as shipped',
  Delivered: 'Mark as delivered',
};

@Component({
  selector: 'om-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, Icon, Avatar, EmptyState, SkeletonRows],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  /** Route param :id (withComponentInputBinding). */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly steps = STEPS;
  protected readonly order = signal<Order | null>(null);
  protected readonly notFound = signal(false);
  protected readonly saving = signal(false);

  protected readonly isCancelled = computed(() => this.order()?.status === 'Cancelled');
  protected readonly currentStep = computed(() => STEPS.indexOf(this.order()?.status ?? 'Pending'));
  /** The single "happy path" next step, shown as the primary button. */
  protected readonly primaryNext = computed(() => {
    const order = this.order();
    return order ? (NEXT_STATUSES[order.status].find((s) => s !== 'Cancelled') ?? null) : null;
  });
  protected readonly canCancel = computed(() => {
    const order = this.order();
    return !!order && NEXT_STATUSES[order.status].includes('Cancelled');
  });
  protected readonly itemCount = computed(() => this.order()?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0);

  ngOnInit(): void {
    this.orderService.getById(this.id()).subscribe({
      next: (order) => this.order.set(order),
      error: (err) => {
        this.notFound.set(true);
        this.toast.error(getErrorMessages(err));
      },
    });
  }

  protected actionLabel(status: OrderStatus): string {
    return ACTION_LABELS[status] ?? status;
  }

  protected stepState(index: number): 'done' | 'current' | 'upcoming' {
    const current = this.currentStep();
    if (this.isCancelled()) {
      return 'upcoming';
    }
    return index < current || (index === current && index === STEPS.length - 1) ? 'done' : index === current ? 'current' : 'upcoming';
  }

  protected async cancel(): Promise<void> {
    const order = this.order();
    if (!order) {
      return;
    }
    const confirmed = await this.confirmService.confirm({
      title: 'Cancel this order?',
      message: `Order ${order.orderNumber} will be cancelled and the reserved stock returned. This can't be undone.`,
      confirmText: 'Cancel order',
      danger: true,
    });
    if (confirmed) {
      this.changeStatus('Cancelled');
    }
  }

  protected changeStatus(status: OrderStatus): void {
    const order = this.order();
    if (!order) {
      return;
    }
    this.saving.set(true);
    this.orderService.updateStatus(order.id, status).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.saving.set(false);
        this.toast.success(`Order ${updated.orderNumber} is now ${updated.status}.`);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(getErrorMessages(err));
      },
    });
  }
}
