import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductUpsert } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/products`;

  getAll(includeInactive = false): Observable<Product[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  create(model: ProductUpsert): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, model);
  }

  update(id: number, model: ProductUpsert): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, model);
  }

  /** Soft delete on the backend. */
  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
