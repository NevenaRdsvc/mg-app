import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../core/services/confirm.service';
import { Icon } from './icon';

@Component({
  selector: 'om-confirm-dialog',
  imports: [Icon],
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  template: `
    @if (confirmService.state(); as dialog) {
      <div class="overlay" (click)="confirmService.close(false)"></div>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div class="dialog-icon" [class.danger]="dialog.danger">
          <om-icon [name]="dialog.danger ? 'alert' : 'info'" [size]="22" />
        </div>
        <h2 id="confirm-title">{{ dialog.title }}</h2>
        <p id="confirm-message">{{ dialog.message }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" (click)="confirmService.close(false)">Keep it</button>
          <button #confirmButton type="button" class="btn" [class.btn-danger]="dialog.danger"
            [class.btn-primary]="!dialog.danger" (click)="confirmService.close(true)">
            {{ dialog.confirmText ?? 'Confirm' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirmService = inject(ConfirmService);
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  protected onEscape(event: Event): void {
    if (this.confirmService.state()) {
      event.preventDefault(); // lets other Escape handlers (modal, drawer) know it was handled
      this.confirmService.close(false);
    }
  }

  constructor() {
    // Move keyboard focus into the dialog when it opens.
    effect(() => this.confirmButton()?.nativeElement.focus());
  }
}
