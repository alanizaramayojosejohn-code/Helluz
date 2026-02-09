import { AsyncPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { User } from '@angular/fire/auth'
import { FormsModule } from '@angular/forms'
import { UserService } from '../../../../../services/user/user.service'
import { Observable } from 'rxjs'
import { AppUser, UserRole } from '../../../../../models/user.model'

@Component({
   selector: 'x-admin-users',
   imports: [AsyncPipe, FormsModule],
   providers: [UserService],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminUsersComponent {
   private userService = inject(UserService)
   users$: Observable<AppUser[]> = this.userService.getUsers()

   async updateRole(uid: string, role: UserRole) {
      try {
         await this.userService.updateUserRole(uid, role)
         alert('Rol actualizado')
      } catch (error) {
         alert('Error al actualizar rol')
      }
   }

   async toggleStatus(uid: string, isActive: boolean) {
      try {
         await this.userService.toggleUserStatus(uid, isActive)
      } catch (error) {
         alert('Error al cambiar estado')
      }
   }
}
