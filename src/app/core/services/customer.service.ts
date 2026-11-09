import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, CustomerUpsert } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/customers`;

  getAll(search?: string): Observable<Customer[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Customer[]>(this.baseUrl, { params });
  }

  create(model: CustomerUpsert): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, model);
  }

  update(id: number, model: CustomerUpsert): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, model);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
