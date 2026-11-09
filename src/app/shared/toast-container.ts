import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'om-toast-container',
  imports: [Icon],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.type" role="status">
          <span class="toast-icon"><om-icon [name]="toast.type === 'success' ? 'check' : 'alert'" [size]="16" /></span>
          <div class="toast-body">
            @for (message of toast.messages; track $index) {
              <div>{{ message }}</div>
            }
          </div>
          <button type="button" class="icon-btn" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            <om-icon name="close" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
