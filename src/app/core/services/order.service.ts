import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api.model';
import { ORDER_STATUSES, Order, OrderCreate, OrderFilter, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/orders`;

  getAll(filter: OrderFilter): Observable<PagedResult<Order>> {
    let params = new HttpParams().set('page', filter.page).set('pageSize', filter.pageSize);
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.customerId) {
      params = params.set('customerId', filter.customerId);
    }
    return this.http.get<PagedResult<Order>>(this.baseUrl, { params });
  }

  /** Number of orders per status (uses totalCount of a 1-item page per status). */
  getStatusCounts(): Observable<Record<OrderStatus, number>> {
    return forkJoin(
      ORDER_STATUSES.map((status) =>
        this.getAll({ status, page: 1, pageSize: 1 }).pipe(map((r) => [status, r.totalCount] as const)),
      ),
    ).pipe(map((pairs) => Object.fromEntries(pairs) as Record<OrderStatus, number>));
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  create(model: OrderCreate): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, model);
  }

  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/status`, { status });
  }
}
