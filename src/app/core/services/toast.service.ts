import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  messages: string[];
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.show('success', [message]);
  }

  error(messages: string | string[]): void {
    this.show('error', Array.isArray(messages) ? messages : [messages]);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: Toast['type'], messages: string[]): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, messages }]);
    setTimeout(() => this.dismiss(id), type === 'error' ? 7000 : 3500);
  }
}
