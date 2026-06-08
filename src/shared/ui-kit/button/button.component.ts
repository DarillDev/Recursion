import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TButtonVariant = 'primary' | 'secondary' | 'danger';
export type TButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'ui-kit-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.primary]': "variant() === 'primary'",
    '[class.secondary]': "variant() === 'secondary'",
    '[class.danger]': "variant() === 'danger'",
  },
})
export class ButtonComponent {
  public readonly variant = input<TButtonVariant>('primary');
  public readonly disabled = input<boolean>(false);
  public readonly type = input<TButtonType>('button');
}
