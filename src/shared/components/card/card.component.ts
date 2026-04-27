import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

export type CardVariant = 'default' | 'accent' | 'inverted' | 'empty'
export type CardPadding = 'none' | 'compact' | 'normal' | 'loose'

@Component({
   selector: 'app-card',
   standalone: true,
   changeDetection: ChangeDetectionStrategy.OnPush,
   template: `
      <div [class]="cssClass()">
         <ng-content></ng-content>
      </div>
   `,
})
export class CardComponent {
   readonly variant = input<CardVariant>('default')
   readonly padding = input<CardPadding>('normal')
   readonly interactive = input(false)

   protected readonly cssClass = computed(() => {
      const variantMap: Record<CardVariant, string> = {
         default:
            'bg-bg-elevated border-hairline border-border-default text-ink shadow-sm',
         accent:
            'bg-bg-brand-soft border-hairline border-border-brand text-ink',
         inverted: 'bg-ink text-on-brand shadow-lg',
         empty:
            'bg-bg-elevated border-hairline border-dashed border-border-default text-ink',
      }
      const padMap: Record<CardPadding, string> = {
         none: '',
         compact: 'p-4',
         normal: 'p-6',
         loose: 'p-8',
      }
      const interactive = this.interactive()
         ? 'transition-shadow duration-normal ease-standard hover:shadow-md cursor-pointer'
         : ''
      return [
         'rounded-xl flex flex-col gap-3',
         variantMap[this.variant()],
         padMap[this.padding()],
         interactive,
      ]
         .filter(Boolean)
         .join(' ')
   })
}
