import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { CustomerService } from '../../../core/services/customer.service';
import { OrderDialogService } from '../../../core/services/order-dialog.service';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessages } from '../../../core/utils/api-error';
import { Avatar } from '../../../shared/avatar';
import { EmptyState } from '../../../shared/empty-state';
import { Icon } from '../../../shared/icon';
import { LOW_STOCK_THRESHOLD } from '../../../shared/stock-indicator';

interface CartLine {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'om-order-create-dialog',
  imports: [FormsModule, CurrencyPipe, Icon, Avatar, EmptyState],
  templateUrl: './order-create-dialog.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class OrderCreateDialog implements OnInit {
  private readonly dialog = inject(OrderDialogService);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly customerSelect = viewChild<ElementRef<HTMLSelectElement>>('customerSelect');

  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;
  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected readonly customerId = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly search = signal('');
  protected readonly cart = signal<CartLine[]>([]);

  protected readonly selectedCustomer = computed(() => this.customers().find((c) => c.id === this.customerId()) ?? null);
  protected readonly filteredProducts = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.products().filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
      : this.products();
  });
  protected readonly total = computed(() => this.cart().reduce((sum, l) => sum + l.product.price * l.quantity, 0));
  protected readonly unitCount = computed(() => this.cart().reduce((sum, l) => sum + l.quantity, 0));
  protected readonly canSubmit = computed(() => this.customerId() !== null && this.cart().length > 0 && !this.saving());

  ngOnInit(): void {
    forkJoin({ customers: this.customerService.getAll(), products: this.productService.getAll() }).subscribe({
      next: ({ customers, products }) => {
        this.customers.set(customers);
        this.products.set(products);
        this.loading.set(false);
        // Start with the first decision: who is the order for?
        setTimeout(() => this.customerSelect()?.nativeElement.focus());
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(getErrorMessages(err));
      },
    });
  }

  protected quantityOf(productId: number): number {
    return this.cart().find((l) => l.product.id === productId)?.quantity ?? 0;
  }

  /** Quantity is always clamped to available stock, so the API never has to reject it. */
  protected setQuantity(product: Product, value: number): void {
    const quantity = Math.max(0, Math.min(Math.floor(Number(value) || 0), product.stockQuantity));
    this.cart.update((lines) => {
      if (quantity === 0) {
        return lines.filter((l) => l.product.id !== product.id);
      }
      return lines.some((l) => l.product.id === product.id)
        ? lines.map((l) => (l.product.id === product.id ? { ...l, quantity } : l))
        : [...lines, { product, quantity }];
    });
  }

  protected increase(product: Product): void {
    this.setQuantity(product, this.quantityOf(product.id) + 1);
  }

  protected decrease(product: Product): void {
    this.setQuantity(product, this.quantityOf(product.id) - 1);
  }

  protected onEscape(event: Event): void {
    // The confirm dialog handles Escape itself when it's open.
    if (event.defaultPrevented || this.confirmService.state()) {
      return;
    }
    this.requestClose();
  }

  /** Ask before throwing away a half-built order. */
  protected async requestClose(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.cart().length > 0 || this.note().trim()) {
      const discard = await this.confirmService.confirm({
        title: 'Discard this order?',
        message: 'The products you added will be lost.',
        confirmText: 'Discard',
        danger: true,
      });
      if (!discard) {
        return;
      }
    }
    this.dialog.close();
  }

  protected submit(): void {
    this.submitted.set(true);
    const customerId = this.customerId();
    if (!this.canSubmit() || customerId === null) {
      return;
    }

    this.saving.set(true);
    this.errors.set([]);
    this.orderService
      .create({
        customerId,
        note: this.note().trim() || null,
        items: this.cart().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      .subscribe({
        next: (order) => {
          this.toast.success(`Order ${order.orderNumber} created.`);
          this.dialog.notifyCreated(order);
          this.dialog.close();
          this.router.navigate(['/orders', order.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.errors.set(getErrorMessages(err));
        },
      });
  }
}
