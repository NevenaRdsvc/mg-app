import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, UserRole } from '../models/auth.model';

const STORAGE_KEY = 'om_auth';

/**
 * Holds the logged in user + JWT.
 * "Remember me" -> localStorage (survives closing the browser).
 * Otherwise     -> sessionStorage (cleared when the browser/tab closes).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<AuthResponse | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAdmin = computed(() => this.hasRole('Admin'));
  readonly fullName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, request).pipe(
      tap((response) => {
        this.session.set(response);
        this.persist(response, request.rememberMe);
      }),
    );
  }

  logout(returnUrl?: string): void {
    this.session.set(null);
    this.clear();
    this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : {} });
  }

  isAuthenticated(): boolean {
    const session = this.session();
    if (!session) {
      return false;
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.session.set(null);
      this.clear();
      return false;
    }
    return true;
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  private restore(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      const session = raw ? (JSON.parse(raw) as AuthResponse) : null;
      return session && new Date(session.expiresAt).getTime() > Date.now() ? session : null;
    } catch {
      return null;
    }
  }

  private persist(session: AuthResponse, rememberMe: boolean): void {
    try {
      this.clear();
      (rememberMe ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable (private mode): the session just won't survive a refresh.
    }
  }

  private clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
