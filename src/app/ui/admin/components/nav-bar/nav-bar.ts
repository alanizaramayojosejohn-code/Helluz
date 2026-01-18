import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { AuthService } from '../../../../services/auth.service'
import { NavbarOptionsComponent } from '../navbar-options/navbar-options'
import { User } from '@angular/fire/auth'

@Component({
   selector: 'app-navbar',
   imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, NavbarOptionsComponent],
   templateUrl: './nav-bar.html',
   styleUrls: ['./nav-bar.css'],
})
export class NavbarComponent implements OnInit {
   user = signal<User | null>(null)

   constructor(public authService: AuthService) {}

   ngOnInit() {
      this.authService.user$.subscribe((user) => {
         this.user.set(user)
      })
   }

   async logout() {
      await this.authService.logout()
   }

   getUserDisplayName(): string {
      const currentUser = this.user()
      if (currentUser?.displayName) {
         return currentUser.displayName
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
      return this.user()?.photoURL || 'https://ui-avatars.com/api/?name=' + this.getUserDisplayName()
   }
}
