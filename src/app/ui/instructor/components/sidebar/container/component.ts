// components/sidebar/component.ts
import { Component, HostListener, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { SidebarService } from '../../../../../services/sidebar/sidebar.service'
import { AuthService } from '../../../../../services/auth/auth.service'
import { MenuItem } from '../../../../../models/interface.config'

@Component({
   selector: 'i-sidebar',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
   templateUrl: './component.html',
   styleUrls: ['./component.css'],
})
export class InstructorSidebarComponent implements OnInit {
   readonly sidebarService = inject(SidebarService)
   private readonly authService = inject(AuthService)

   userRole = signal<'admin' | 'instructor' | null>(null)

   // Menú de navegación
   menuItems: MenuItem[] = [
      { label: 'Dashboard', icon: 'dashboard', route: '/instructor/home', roles: ['admin', 'instructor'] },
      { label: 'Alumnos', icon: 'school', route: '/instructor/alumnos', roles: ['admin', 'instructor'] },
      {
         label: 'Inscripciones',
         icon: 'assignment',
         route: '/instructor/inscripciones',
         roles: ['admin', 'instructor'],
      },
      {
         label: 'Asistencias Alumnos',
         icon: 'list_alt',
         route: '/instructor/asistenciasa',
         roles: ['admin', 'instructor'],
      },
   ]
   //  done_all

   ngOnInit(): void {
      this.checkScreenSize()

      this.authService.currentUser$.subscribe((user) => {
         this.userRole.set(user?.role || null)
      })
   }

   @HostListener('window:resize')
   onResize(): void {
      this.checkScreenSize()
   }

   private checkScreenSize(): void {
      const isMobile = window.innerWidth < 1024 // Cambiar de 768 a 1024
      this.sidebarService.setMobile(isMobile)
   }

   closeSidebarOnMobile(): void {
      if (this.sidebarService.isMobile()) {
         this.sidebarService.close()
      }
   }

   canShowMenuItem(item: MenuItem): boolean {
      const role = this.userRole()
      if (!item.roles || !role) return true
      return item.roles.includes(role)
   }

   getFilteredMenuItems(): MenuItem[] {
      return this.menuItems.filter((item) => this.canShowMenuItem(item))
   }
}
