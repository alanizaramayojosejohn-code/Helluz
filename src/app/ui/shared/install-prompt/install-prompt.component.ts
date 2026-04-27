import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { InstallPromptService } from './install-prompt.service'

@Component({
   selector: 'x-install-prompt',
   standalone: true,
   templateUrl: './install-prompt.component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallPromptComponent {
   private readonly service = inject(InstallPromptService)

   readonly shouldShow = this.service.shouldShow
   readonly canInstall = this.service.canInstall
   readonly isIos = this.service.isIos

   install(): void {
      void this.service.promptInstall()
   }

   dismiss(): void {
      this.service.dismiss()
   }
}
