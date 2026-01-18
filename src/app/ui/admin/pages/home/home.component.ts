import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatCardModule } from '@angular/material/card'
import { AuthService } from '../../../../services/auth.service'
import { User } from '@angular/fire/auth'
import { MatDividerModule } from '@angular/material/divider'
import { MatMenuModule } from '@angular/material/menu'

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
   // styleUrls: ['./home.component.css']
})
export class Home implements OnInit {
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
