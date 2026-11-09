import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

@Component({
  selector: 'om-empty-state',
  imports: [Icon],
  template: `
    <div class="empty-state">
      <div class="empty-icon"><om-icon [name]="icon()" [size]="24" /></div>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
