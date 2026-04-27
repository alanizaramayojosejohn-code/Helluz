import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'

export interface Crumb {
   label: string
   link?: string | unknown[]
}

@Component({
   selector: 'app-page-header',
   standalone: true,
   imports: [RouterLink],
   changeDetection: ChangeDetectionStrategy.OnPush,
   template: `
      <header class="flex flex-col gap-3 pb-7 mb-7 border-b border-hairline border-border-default">
         @if (crumbs().length) {
            <nav class="flex items-center gap-2 text-body-sm text-muted" aria-label="Breadcrumb">
               @for (c of crumbs(); track $index; let last = $last) {
                  @if (c.link) {
                     <a
                        [routerLink]="c.link"
                        class="font-semibold hover:text-ink transition-colors duration-fast ease-standard"
                        >{{ c.label }}</a
                     >
                  } @else {
                     <span class="font-extrabold text-ink">{{ c.label }}</span>
                  }
                  @if (!last) {
                     <span class="text-faint" aria-hidden="true">›</span>
                  }
               }
            </nav>
         }

         <div class="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <div class="flex-1 flex flex-col gap-1.5">
               @if (kicker()) {
                  <span
                     class="text-label font-extrabold tracking-[0.2em] text-faint uppercase"
                     >{{ kicker() }}</span
                  >
               }
               <h1 class="text-h1 font-extrabold tracking-[-0.04em] text-ink leading-[1.05] m-0">
                  {{ title() }}
               </h1>
               @if (subtitle()) {
                  <p class="text-body-sm text-muted m-0">{{ subtitle() }}</p>
               }
            </div>

            <div class="flex items-center gap-2 flex-wrap">
               <ng-content></ng-content>
            </div>
         </div>
      </header>
   `,
})
export class PageHeaderComponent {
   readonly kicker = input<string | null>(null)
   readonly title = input.required<string>()
   readonly subtitle = input<string | null>(null)
   readonly crumbs = input<Crumb[]>([])
}
