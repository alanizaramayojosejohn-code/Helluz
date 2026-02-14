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
   selector: 'app-sidebar',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
   templateUrl: './component.html',
   styleUrls: ['./component.css'],
})
export class SidebarComponent implements OnInit {
   readonly sidebarService = inject(SidebarService)
   private readonly authService = inject(AuthService)

   userRole = signal<'admin' | 'instructor' | null>(null)

   // Menú de navegación
   menuItems: MenuItem[] = [
      { label: 'Dashboard', icon: 'dashboard', route: '/admin/home', roles: ['admin', 'instructor'] },
      { label: 'Alumnos', icon: 'school', route: '/admin/alumnos', roles: ['admin', 'instructor'] },
      { label: 'Inscripciones', icon: 'assignment', route: '/admin/inscripciones', roles: ['admin', 'instructor'] },
      { label: 'Horarios', icon: 'schedule', route: '/admin/horarios', roles: ['admin', 'instructor'] },
      { label: 'Membresías', icon: 'card_membership', route: '/admin/membresias', roles: ['admin'] },
      { label: 'Instructores', icon: 'fitness_center', route: '/admin/instructores', roles: ['admin'] },
      { label: 'Usuarios', icon: 'people', route: '/admin/usuarios', roles: ['admin'] },
      { label: 'Sucursales', icon: 'business', route: '/admin/sucursales', roles: ['admin'] },
   ]

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
