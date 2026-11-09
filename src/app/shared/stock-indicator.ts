import { Component, computed, input } from '@angular/core';

export const LOW_STOCK_THRESHOLD = 10;

/** Number + small bar; red when low, amber when getting low. */
@Component({
  selector: 'om-stock',
  template: `
    <span class="stock" [class]="'stock stock-' + level()">
      <span class="stock-value">{{ quantity() }}</span>
      <span class="stock-bar"><span class="stock-fill" [style.width.%]="fill()"></span></span>
    </span>
  `,
})
export class StockIndicator {
  readonly quantity = input.required<number>();
  protected readonly level = computed(() => {
    const q = this.quantity();
    return q < LOW_STOCK_THRESHOLD ? 'low' : q < 25 ? 'medium' : 'ok';
  });
  protected readonly fill = computed(() => Math.max(4, Math.min(100, (this.quantity() / 50) * 100)));
}
