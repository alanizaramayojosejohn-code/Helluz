import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter } from 'rxjs/operators'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatMenuModule } from '@angular/material/menu'
import { AuthService } from '../../../../../services/auth/auth.service'
import { SidebarService } from '../../../../../services/sidebar/sidebar.service'
import { AuthUser } from '../../../../../models/user.model'

@Component({
   selector: 'i-header',
   standalone: true,
   imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule],
   templateUrl: './component.html',
})
export class InstructorHeaderComponent implements OnInit {
   private readonly authService = inject(AuthService)
   private readonly router = inject(Router)
   private readonly route = inject(ActivatedRoute)
   readonly sidebarService = inject(SidebarService)

   user = signal<AuthUser | null>(null)
   currentPageLabel = signal<string>('')

   ngOnInit(): void {
      this.authService.currentUser$.subscribe((user) => {
         this.user.set(user)
      })

      this.updateBreadcrumb()
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
         this.updateBreadcrumb()
      })
   }

   private updateBreadcrumb(): void {
      let active = this.route.root
      while (active.firstChild) {
         active = active.firstChild
      }
      const data = active.snapshot.data
      this.currentPageLabel.set(data?.['breadcrumb'] || '')
   }

   toggleSidebar(): void {
      this.sidebarService.toggle()
   }

   async logout(): Promise<void> {
      await this.authService.logout()
   }

   getUserDisplayName(): string {
      const u = this.user()
      if (u?.name) {
         const last = u.lastname ? ` ${u.lastname}` : ''
         return `${u.name}${last}`
      }
      if (u?.email) return u.email.split('@')[0]
      return 'Usuario'
   }

   getUserEmail(): string {
      return this.user()?.email || 'Sin email'
   }

   getUserInitials(): string {
      const u = this.user()
      if (u?.name && u?.lastname) {
         return `${u.name[0]}${u.lastname[0]}`.toUpperCase()
      }
      if (u?.name) return u.name[0].toUpperCase()
      if (u?.email) return u.email[0].toUpperCase()
      return 'U'
   }

   getUserRole(): string {
      const role = this.user()?.role
      if (role === 'superAdmin') return 'Super Administrador'
      if (role === 'admin') return 'Administrador'
      return 'Instructor'
   }
}
