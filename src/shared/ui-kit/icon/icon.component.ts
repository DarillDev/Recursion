import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { EIconName } from './enums/icon-name.enum';

@Component({
  selector: 'ui-kit-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  public readonly name = input.required<EIconName | `${EIconName}`>();
  public readonly size = input<number>(16);
}
