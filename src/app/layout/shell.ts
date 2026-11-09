import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { OrderDialogService } from '../core/services/order-dialog.service';
import { OrderCreateDialog } from '../features/orders/order-create/order-create-dialog';
import { Avatar } from '../shared/avatar';
import { Icon, IconName } from '../shared/icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'om-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Avatar, OrderCreateDialog],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly orderDialog = inject(OrderDialogService);

  protected readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/orders', label: 'Orders', icon: 'orders' },
    { path: '/products', label: 'Products', icon: 'products' },
    { path: '/customers', label: 'Customers', icon: 'customers' },
  ];
}
