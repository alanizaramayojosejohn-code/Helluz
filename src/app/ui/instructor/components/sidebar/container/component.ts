import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatMenuModule } from '@angular/material/menu'
import { SidebarService } from '../../../../../services/sidebar/sidebar.service'
import { AuthService } from '../../../../../services/auth/auth.service'
import { MenuItem } from '../../../../../models/interface.config'

@Component({
   selector: 'i-sidebar',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatMenuModule],
   templateUrl: './component.html',
})
export class InstructorSidebarComponent implements OnInit {
   readonly sidebarService = inject(SidebarService)
   private readonly authService = inject(AuthService)

   userRole = signal<'admin' | 'instructor' | null>(null)
   userName = signal('Usuario')
   userInitials = signal('U')

   readonly roleLabel = computed(() => {
      const role = this.userRole()
      if (role === 'admin') return 'Administrador'
      if (role === 'instructor') return 'Instructor'
      return ''
   })

   menuItems: MenuItem[] = [
      { label: 'Dashboard', icon: 'dashboard', route: '/instructor/home', roles: ['admin', 'instructor'] },
      { label: 'Alumnos', icon: 'school', route: '/instructor/alumnos', roles: ['admin', 'instructor'] },
      { label: 'Inscripciones', icon: 'assignment', route: '/instructor/inscripciones', roles: ['admin', 'instructor'] },
      { label: 'Asistencias alumnos', icon: 'list_alt', route: '/instructor/asistenciasa', roles: ['admin', 'instructor'] },
      { label: 'Marcar asistencia', icon: 'qr_code_scanner', route: '/instructor/asistenciainstructores', roles: ['admin', 'instructor'] },
   ]

   ngOnInit(): void {
      this.checkScreenSize()

      this.authService.currentUser$.subscribe((user) => {
         this.userRole.set(user?.role || null)
         if (user?.name) {
            const last = user.lastname || ''
            this.userName.set(`${user.name} ${last}`.trim())
            this.userInitials.set(`${user.name[0] || ''}${last[0] || ''}`.toUpperCase() || 'U')
         } else if (user?.email) {
            this.userName.set(user.email.split('@')[0])
            this.userInitials.set(user.email[0].toUpperCase())
         }
      })
   }

   @HostListener('window:resize')
   onResize(): void {
      this.checkScreenSize()
   }

   private checkScreenSize(): void {
      const isMobile = window.innerWidth < 1024
      this.sidebarService.setMobile(isMobile)
   }

   toggleSidebar(): void {
      this.sidebarService.toggle()
   }

   closeSidebarOnMobile(): void {
      if (this.sidebarService.isMobile()) {
         this.sidebarService.close()
      }
   }

   async logout(): Promise<void> {
      await this.authService.logout()
   }

   private canShowMenuItem(item: MenuItem): boolean {
      const role = this.userRole()
      if (!item.roles || !role) return true
      return item.roles.includes(role)
   }

   getFilteredMenuItems(): MenuItem[] {
      return this.menuItems.filter((item) => this.canShowMenuItem(item))
   }
}
