// components/list/container/component.ts
import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { Observable } from 'rxjs'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'
import { UserService } from '../../../../../../../services/user/user.service'
import { User } from '../../../../../../../models/user.model'

@Component({
   selector: 'x-user-list',
   imports: [MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule, AsyncPipe],
   templateUrl: './component.html',
})
export class UserList implements OnInit {
   private readonly userService = inject(UserService)
   private readonly destroyRef = inject(DestroyRef)

   readonly createUser = output<void>()
   readonly editUser = output<string>()
   readonly viewDetail = output<string>()

   users$!: Observable<User[]>

   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)
   readonly roleFilter = signal<'all' | 'admin' | 'instructor'>('all')

   ngOnInit(): void {
      this.loadData()
   }

   private loadData(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.users$ = this.userService.getUsers()

      this.users$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
         next: () => this.isLoading.set(false),
         error: () => {
            this.errorMessage.set('Error al cargar usuarios')
            this.isLoading.set(false)
         },
      })
   }

   onCreateUser(): void {
      this.createUser.emit()
   }

   onEditUser(user: User): void {
      if (user.id) {
         this.editUser.emit(user.id)
      }
   }

   onViewDetail(user: User): void {
      if (user.id) {
         this.viewDetail.emit(user.id)
      }
   }

   async onToggleStatus(user: User): Promise<void> {
      if (!user.id) return

      try {
         await this.userService.toggleStatus(user.id, user.status)
      } catch (error) {
         this.errorMessage.set('Error al cambiar el estado')
      }
   }

   async onResetPassword(user: User): Promise<void> {
      const confirmed = confirm(`¿Enviar email de recuperación de contraseña a ${user.email}?`)
      if (!confirmed) return

      try {
         await this.userService.resetPassword(user.email)
         alert('Email de recuperación enviado correctamente')
      } catch (error: any) {
         this.errorMessage.set(error.message || 'Error al enviar email de recuperación')
      }
   }

   onRoleFilterChange(role: 'all' | 'admin' | 'instructor'): void {
      this.roleFilter.set(role)
   }

   filterUsers(users: User[]): User[] {
      const filter = this.roleFilter()
      if (filter === 'all') return users
      return users.filter((u) => u.role === filter)
   }

   getFullName(user: User): string {
      return `${user.name} ${user.lastname}`
   }

   getRoleBadgeClass(role: string): string {
      return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
   }
}
