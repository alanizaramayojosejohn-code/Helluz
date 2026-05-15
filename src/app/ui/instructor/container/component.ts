import { Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { InstructorHeaderComponent } from '../components/header/container/component'
import { InstructorSidebarComponent } from '../components/sidebar/container/component'
import { SidebarService } from '../../../services/sidebar/sidebar.service'

@Component({
   selector: 'x-component',
   imports: [RouterOutlet, InstructorHeaderComponent, InstructorSidebarComponent],
   templateUrl: './component.html',
})
export default class InstructorComponent {
   readonly sidebarService = inject(SidebarService)
}
