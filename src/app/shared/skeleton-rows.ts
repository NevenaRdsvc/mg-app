import { Component, input } from '@angular/core';

@Component({
  selector: 'om-skeleton-rows',
  template: `
    <div class="skeleton-list" aria-busy="true" aria-label="Loading">
      @for (row of rowsArray(); track $index) {
        <div class="skeleton-row">
          <span class="skeleton skeleton-circle"></span>
          <span class="skeleton skeleton-line" style="width: 30%"></span>
          <span class="skeleton skeleton-line" style="width: 20%"></span>
          <span class="skeleton skeleton-line" style="width: 12%; margin-left: auto"></span>
        </div>
      }
    </div>
  `,
})
export class SkeletonRows {
  readonly rows = input(5);
  protected rowsArray(): number[] {
    return Array.from({ length: this.rows() });
  }
}
