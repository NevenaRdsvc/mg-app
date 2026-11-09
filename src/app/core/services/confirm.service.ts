import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/** Promise-based confirmation dialog (replaces window.confirm). */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => this.state.set({ ...options, resolve }));
  }

  close(confirmed: boolean): void {
    const current = this.state();
    if (current) {
      current.resolve(confirmed);
      this.state.set(null);
    }
  }
}
