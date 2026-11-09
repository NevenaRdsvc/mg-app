import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './shared/confirm-dialog';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'om-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialog],
  template: `
    <router-outlet />
    <om-toast-container />
    <om-confirm-dialog />
  `,
})
export class App {}
