import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { SeedService } from '../../../../services/seed/seed.service'

@Component({
   selector: 'x-component',
   imports: [],
   providers: [SeedService],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SeedComponent {
   message = ''

   private seedServices = inject(SeedService)

   async addSeed() {
      this.message = ''

      try {
         this.seedServices.seedDays
         this.seedServices.seedDiscipline
         this.message = 'Subida correcta'
      } catch (error) {
         this.message = 'Error al subir los seeds'
      }
   }
}
