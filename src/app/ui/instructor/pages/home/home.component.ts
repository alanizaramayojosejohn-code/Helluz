import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatMenuModule } from '@angular/material/menu'
import { AuthService } from '../../../../services/auth/auth.service'
import { AuthUser } from '../../../../models/user.model'
import { Observable } from 'rxjs'

@Component({
   selector: 'app-home',
   standalone: true,
   imports: [
      CommonModule,
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatDividerModule,
      MatMenuModule,
   ],
   templateUrl: './home.component.html',
})
export default class Home implements OnInit {
   user = signal<AuthUser | null>(null)
   user$!: Observable<AuthUser | null>

   constructor(public authService: AuthService) {}

   ngOnInit() {
      this.user$ = this.authService.currentUser$

      this.authService.currentUser$.subscribe((user) => {
         this.user.set(user)
      })
   }

   async logout() {
      await this.authService.logout()
   }

   getUserDisplayName(): string {
      const currentUser = this.user()
      if (currentUser?.name) {
         return `${currentUser.name} ${currentUser.lastname}`
      }
      if (currentUser?.email) {
         return currentUser.email.split('@')[0]
      }
      return 'Usuario'
   }

   getUserEmail(): string {
      return this.user()?.email || 'Sin email'
   }

   getPhotoURL(): string {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.getUserDisplayName())
   }

   getUserRole(): string {
      const currentUser = this.user()
      return currentUser?.role === 'admin' ? 'Administrador' : 'Instructor'
   }
}
