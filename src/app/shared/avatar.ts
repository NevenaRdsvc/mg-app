import { Component, computed, input } from '@angular/core';

const PALETTE: [string, string][] = [
  ['#eef2ff', '#4338ca'],
  ['#ecfdf5', '#047857'],
  ['#fff7ed', '#c2410c'],
  ['#fdf2f8', '#be185d'],
  ['#f0f9ff', '#0369a1'],
  ['#f5f3ff', '#6d28d9'],
];

/** Initials avatar; the color is stable per seed (e.g. customer id). */
@Component({
  selector: 'om-avatar',
  template: `{{ initials() }}`,
  host: {
    class: 'avatar',
    'aria-hidden': 'true',
    '[class.avatar-sm]': "size() === 'sm'",
    '[style.background]': 'colors()[0]',
    '[style.color]': 'colors()[1]',
  },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly seed = input(0);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly initials = computed(() =>
    this.name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
  protected readonly colors = computed(() => PALETTE[Math.abs(this.seed()) % PALETTE.length]);
}
