import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/models/product.model';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessages } from '../../core/utils/api-error';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { SkeletonRows } from '../../shared/skeleton-rows';
import { LOW_STOCK_THRESHOLD, StockIndicator } from '../../shared/stock-indicator';

@Component({
  selector: 'om-product-list',
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe, Icon, EmptyState, SkeletonRows, StockIndicator],
  templateUrl: './product-list.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class ProductList implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errors = signal<string[]>([]);
  /** null = drawer closed, 0 = creating, >0 = editing that product. */
  protected readonly editingId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly showInactive = signal(false);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.products().filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
      : this.products();
  });
  protected readonly lowStockCount = computed(
    () => this.products().filter((p) => p.isActive && p.stockQuantity < LOW_STOCK_THRESHOLD).length,
  );

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    sku: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', Validators.maxLength(2000)],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
    // Quick action from the dashboard: /products?new=1
    if (this.route.snapshot.queryParamMap.get('new') && this.auth.isAdmin()) {
      this.openCreate();
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  protected toggleInactive(value: boolean): void {
    this.showInactive.set(value);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.productService.getAll(this.showInactive()).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(getErrorMessages(err));
      },
    });
  }

  protected openCreate(): void {
    this.form.reset();
    this.errors.set([]);
    this.editingId.set(0);
  }

  protected openEdit(product: Product): void {
    this.form.reset({
      name: product.name,
      sku: product.sku,
      description: product.description ?? '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
    });
    this.errors.set([]);
    this.editingId.set(product.id);
  }

  protected close(): void {
    this.editingId.set(null);
  }

  protected showError(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.editingId();
    const value = { ...this.form.getRawValue(), description: this.form.controls.description.value.trim() || null };
    const request$ = id ? this.productService.update(id, value) : this.productService.create(value);

    this.saving.set(true);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.editingId.set(null);
        this.toast.success(`Product "${saved.name}" saved.`);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.set(getErrorMessages(err));
      },
    });
  }

  protected async deactivate(product: Product): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: `Deactivate ${product.name}?`,
      message: 'It will no longer be available for new orders. Existing orders are not affected, and you can reactivate it later.',
      confirmText: 'Deactivate',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.productService.deactivate(product.id).subscribe({
      next: () => {
        this.toast.success(`"${product.name}" deactivated.`);
        this.load();
      },
      error: (err) => this.toast.error(getErrorMessages(err)),
    });
  }
}
