import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Customer } from '../../core/models/customer.model';
import { ConfirmService } from '../../core/services/confirm.service';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { getErrorMessages } from '../../core/utils/api-error';
import { Avatar } from '../../shared/avatar';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { SkeletonRows } from '../../shared/skeleton-rows';

@Component({
  selector: 'om-customer-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Icon, Avatar, EmptyState, SkeletonRows],
  templateUrl: './customer-list.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class CustomerList implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  private readonly search$ = new Subject<string>();

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly editingId = signal<number | null>(null);
  protected readonly searchTerm = signal('');

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phone: ['', Validators.maxLength(30)],
    address: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    // Wait until the user stops typing for 300 ms before calling the API.
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());

    this.reload();

    if (this.route.snapshot.queryParamMap.get('new')) {
      this.openCreate();
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.search$.next(term);
  }

  protected reload(): void {
    this.loading.set(true);
    this.customerService.getAll(this.searchTerm()).subscribe({
      next: (customers) => {
        this.customers.set(customers);
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

  protected openEdit(customer: Customer): void {
    this.form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      address: customer.address ?? '',
    });
    this.errors.set([]);
    this.editingId.set(customer.id);
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

    const raw = this.form.getRawValue();
    const value = { ...raw, phone: raw.phone.trim() || null, address: raw.address.trim() || null };
    const id = this.editingId();
    const request$ = id ? this.customerService.update(id, value) : this.customerService.create(value);

    this.saving.set(true);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.editingId.set(null);
        this.toast.success(`Customer ${saved.firstName} ${saved.lastName} saved.`);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.set(getErrorMessages(err));
      },
    });
  }

  protected async remove(customer: Customer): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: `Delete ${customer.firstName} ${customer.lastName}?`,
      message: "This permanently removes the customer. Customers with existing orders can't be deleted.",
      confirmText: 'Delete customer',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.customerService.delete(customer.id).subscribe({
      next: () => {
        this.toast.success('Customer deleted.');
        this.reload();
      },
      error: (err) => this.toast.error(getErrorMessages(err)),
    });
  }
}
