import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstructorHeaderComponent } from "../components/header/container/component";
import { InstructorSidebarComponent } from "../components/sidebar/container/component";
import { SidebarService } from '../../../services/sidebar/sidebar.service';

@Component({
  selector: 'x-component',
  imports: [RouterOutlet, InstructorHeaderComponent, InstructorSidebarComponent],
  templateUrl: './component.html',
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
export default class InstructorComponent {
   constructor(readonly sidebarService: SidebarService) {}



}
