import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { ORDER_STATUSES, Order, OrderStatus } from '../../../core/models/order.model';
import { OrderDialogService } from '../../../core/services/order-dialog.service';
import { CustomerService } from '../../../core/services/customer.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessages } from '../../../core/utils/api-error';
import { Avatar } from '../../../shared/avatar';
import { EmptyState } from '../../../shared/empty-state';
import { Icon } from '../../../shared/icon';
import { SkeletonRows } from '../../../shared/skeleton-rows';
import { StatusBadge } from '../../../shared/status-badge';

@Component({
  selector: 'om-order-list',
  imports: [FormsModule, CurrencyPipe, DatePipe, StatusBadge, Icon, Avatar, EmptyState, SkeletonRows],
  templateUrl: './order-list.html',
})
export class OrderList implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly orderDialog = inject(OrderDialogService);

  protected readonly statuses = ORDER_STATUSES;
  protected readonly pageSize = 10;

  protected readonly orders = signal<Order[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly counts = signal<Record<OrderStatus, number> | null>(null);
  protected readonly loading = signal(true);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);

  // Filters live in the URL (?status=&customerId=&page=) so back/refresh/share keep them.
  protected readonly status = signal<OrderStatus | null>(null);
  protected readonly customerId = signal<number | null>(null);
  protected readonly page = signal(1);

  protected readonly allCount = computed(() => {
    const c = this.counts();
    return c ? ORDER_STATUSES.reduce((sum, s) => sum + c[s], 0) : 0;
  });
  protected readonly hasFilters = computed(() => this.status() !== null || this.customerId() !== null);
  protected readonly rangeStart = computed(() => (this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1));
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize, this.totalCount()));

  ngOnInit(): void {
    this.customerService.getAll().subscribe({ next: (c) => this.customers.set(c) });
    this.loadCounts();
    this.orderDialog.created$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadCounts();
      this.load();
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const status = params.get('status');
      this.status.set(status && (ORDER_STATUSES as string[]).includes(status) ? (status as OrderStatus) : null);
      const customerId = Number(params.get('customerId'));
      this.customerId.set(customerId > 0 ? customerId : null);
      const page = Number(params.get('page'));
      this.page.set(page > 0 ? page : 1);
      this.load();
    });
  }

  protected setStatus(status: OrderStatus | null): void {
    this.updateQuery({ status, page: null });
  }

  protected setCustomer(customerId: number | null): void {
    this.updateQuery({ customerId, page: null });
  }

  protected clearFilters(): void {
    this.updateQuery({ status: null, customerId: null, page: null });
  }

  protected goToPage(page: number): void {
    this.updateQuery({ page: page === 1 ? null : page });
  }

  protected open(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  private loadCounts(): void {
    this.orderService.getStatusCounts().subscribe({ next: (c) => this.counts.set(c) });
  }

  private updateQuery(queryParams: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  private load(): void {
    this.loading.set(true);
    this.orderService
      .getAll({ status: this.status(), customerId: this.customerId(), page: this.page(), pageSize: this.pageSize })
      .subscribe({
        next: (result) => {
          this.orders.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.error(getErrorMessages(err));
          this.loading.set(false);
        },
      });
  }
}
