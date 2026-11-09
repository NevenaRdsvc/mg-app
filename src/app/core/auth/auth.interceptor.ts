import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Adds "Authorization: Bearer <token>" to API calls and logs out when the API answers 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isLoginCall = req.url.endsWith('/api/auth/login');
  const token = auth.token();

  const request = isApiCall && token && !isLoginCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiCall && !isLoginCall) {
        auth.logout(router.url); // token expired or invalid
      }
      return throwError(() => error);
    }),
  );
};
