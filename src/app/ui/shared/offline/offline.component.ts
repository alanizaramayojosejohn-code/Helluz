import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { OfflineService } from './offline.service'

@Component({
   selector: 'x-offline',
   standalone: true,
   templateUrl: './offline.component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {
   private readonly offline = inject(OfflineService)

   readonly isOffline = this.offline.isOffline

   reload(): void {
      window.location.reload()
   }
}
