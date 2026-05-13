import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SidebarService } from '../../../services/sidebar/sidebar.service'
import { HeaderComponent } from '../components/header/container/component'
import { SidebarComponent } from '../components/sidebar/container/component'

@Component({
   selector: 'x-admin',
   templateUrl: './component.html',
   imports: [RouterOutlet, HeaderComponent, SidebarComponent],
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminComponent {
   constructor(readonly sidebarService: SidebarService) {}
}
