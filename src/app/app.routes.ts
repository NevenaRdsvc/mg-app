import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    // Everything inside the shell requires a logged in user.
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'orders',
        title: 'Orders',
        loadComponent: () => import('./features/orders/order-list/order-list').then((m) => m.OrderList),
      },
      {
        path: 'orders/:id',
        title: 'Order details',
        loadComponent: () => import('./features/orders/order-detail/order-detail').then((m) => m.OrderDetail),
      },
      {
        path: 'products',
        title: 'Products',
        loadComponent: () => import('./features/products/product-list').then((m) => m.ProductList),
      },
      {
        path: 'customers',
        title: 'Customers',
        loadComponent: () => import('./features/customers/customer-list').then((m) => m.CustomerList),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
