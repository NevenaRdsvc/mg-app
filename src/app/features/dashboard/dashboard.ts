import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { OrderDialogService } from '../../core/services/order-dialog.service';
import { ORDER_STATUSES, Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessages } from '../../core/utils/api-error';
import { Avatar } from '../../shared/avatar';
import { EmptyState } from '../../shared/empty-state';
import { Icon, IconName } from '../../shared/icon';
import { SkeletonRows } from '../../shared/skeleton-rows';
import { StatusBadge } from '../../shared/status-badge';
import { LOW_STOCK_THRESHOLD, StockIndicator } from '../../shared/stock-indicator';

interface Kpi {
  label: string;
  value: number;
  hint: string;
  icon: IconName;
  tone: 'primary' | 'warning' | 'info' | 'success';
  status: OrderStatus | null;
}

@Component({
  selector: 'om-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, Icon, Avatar, StockIndicator, EmptyState, SkeletonRows],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  protected readonly orderDialog = inject(OrderDialogService);

  protected readonly loading = signal(true);
  protected readonly counts = signal<Record<OrderStatus, number> | null>(null);
  protected readonly recentOrders = signal<Order[]>([]);
  protected readonly lowStock = signal<Product[]>([]);
  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  })();
  protected readonly today = new Date();

  protected readonly total = computed(() => {
    const c = this.counts();
    return c ? ORDER_STATUSES.reduce((sum, s) => sum + c[s], 0) : 0;
  });

  protected readonly kpis = computed<Kpi[]>(() => {
    const c = this.counts();
    if (!c) {
      return [];
    }
    return [
      { label: 'Total orders', value: this.total(), hint: 'All time', icon: 'orders', tone: 'primary', status: null },
      {
        label: 'Awaiting confirmation',
        value: c.Pending,
        hint: c.Pending ? 'Needs your action' : 'All caught up',
        icon: 'clock',
        tone: 'warning',
        status: 'Pending',
      },
      { label: 'In transit', value: c.Shipped, hint: 'Shipped, not delivered', icon: 'truck', tone: 'info', status: 'Shipped' },
      { label: 'Delivered', value: c.Delivered, hint: 'Completed orders', icon: 'check', tone: 'success', status: 'Delivered' },
    ];
  });

  /** Segments for the status distribution bar. */
  protected readonly segments = computed(() => {
    const c = this.counts();
    const total = this.total();
    if (!c || total === 0) {
      return [];
    }
    return ORDER_STATUSES.map((status) => ({ status, count: c[status], percent: (c[status] / total) * 100 }));
  });

  ngOnInit(): void {
    this.load();
    this.orderDialog.created$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  private load(): void {
    forkJoin({
      counts: this.orderService.getStatusCounts(),
      recent: this.orderService.getAll({ page: 1, pageSize: 6 }),
      products: this.productService.getAll(),
    }).subscribe({
      next: ({ counts, recent, products }) => {
        this.counts.set(counts);
        this.recentOrders.set(recent.items);
        this.lowStock.set(
          products
            .filter((p) => p.stockQuantity < LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.stockQuantity - b.stockQuantity)
            .slice(0, 6),
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(getErrorMessages(err));
        this.loading.set(false);
      },
    });
  }
}
