import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SidebarService } from '../../../services/sidebar/sidebar.service'
import { HeaderComponent } from '../components/header/container/component'
import { SidebarComponent } from '../components/sidebar/container/component'

@Component({
   selector: 'x-admin',
   templateUrl: './component.html',
   imports: [RouterOutlet, HeaderComponent, SidebarComponent],
   styles: [
      `
         .app-container {
            min-height: 100vh;
            background: #f9fafb;
         }

         .main-content {
            padding: 2rem;
            transition: margin-left 0.3s ease;
            margin-top: 2rem; /* Altura del header */
         }

         .content-collapsed {
            margin-left: 256px;
         }

         .content-expanded {
            margin-left: 72px;
         }

         @media (max-width: 768px) {
            .content-collapsed,
            .content-expanded {
               margin-left: 0;
            }
         }
      `,
   ],
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminComponent {
   constructor(readonly sidebarService: SidebarService) {}
}
