import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
   selector: 'x-admin',
   templateUrl: './component.html',
   imports: [RouterOutlet,],
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminComponent {}
