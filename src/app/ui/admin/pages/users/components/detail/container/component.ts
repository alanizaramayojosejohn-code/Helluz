import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../../../../../services/user/user.service';
import { User } from '../../../../../../../models/user.model';

@Component({
  selector: 'x-user-detail',
  imports: [
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './component.html',
})
export class UserDetail implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly userId = input.required<string>();

  readonly edit = output<string>();
  readonly close = output<void>();

  readonly user = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUser();
  }

  private loadUser(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService
      .getUserById(this.userId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          if (user) {
            this.user.set(user);
          } else {
            this.errorMessage.set('Usuario no encontrado');
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar el usuario');
          this.isLoading.set(false);
        },
      });
  }

  onEdit(): void {
    const id = this.userId();
    if (id) {
      this.edit.emit(id);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  async onToggleStatus(): Promise<void> {
    const user = this.user();
    if (!user?.id) return;

    try {
      await this.userService.toggleStatus(user.id, user.status);
    } catch (error) {
      this.errorMessage.set('Error al cambiar el estado');
    }
  }

  async onResetPassword(): Promise<void> {
    const user = this.user();
    if (!user?.email) return;

    const confirmed = confirm(`¿Enviar email de recuperación de contraseña a ${user.email}?`);
    if (!confirmed) return;

    try {
      await this.userService.resetPassword(user.email);
      alert('Email de recuperación enviado correctamente');
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al enviar email');
    }
  }

  async onDelete(): Promise<void> {
    const user = this.user();
    if (!user?.id) return;

    const confirmed = confirm(
      `⚠️ ADVERTENCIA: Esta acción solo eliminará el usuario de Firestore.\n\n` +
      `Debes eliminar manualmente el usuario de Firebase Authentication:\n` +
      `1. Ir a Firebase Console → Authentication → Users\n` +
      `2. Buscar y eliminar: ${user.email}\n\n` +
      `¿Continuar con la eliminación en Firestore?`
    );

    if (!confirmed) return;

    try {
      this.isLoading.set(true);
      await this.userService.deleteUser(user.id);
      alert('Usuario eliminado de Firestore. No olvides eliminarlo también de Firebase Authentication.');
      this.close.emit();
    } catch (error) {
      this.errorMessage.set('Error al eliminar el usuario');
      this.isLoading.set(false);
    }
  }

  getFullName(): string {
    const user = this.user();
    if (!user) return '';
    return `${user.name} ${user.lastname}`;
  }

  getRoleBadgeClass(): string {
    const user = this.user();
    return user?.role === 'admin'
      ? 'bg-purple-500 text-white'
      : 'bg-blue-500 text-white';
  }

  getRoleLabel(): string {
    const user = this.user();
    return user?.role === 'admin' ? 'Administrador' : 'Instructor';
  }

  getCreatedAtDate(): Date | null {
    const user = this.user();
    if (!user?.createdAt) return null;
    return user.createdAt.toDate();
  }

  getUpdatedAtDate(): Date | null {
    const user = this.user();
    if (!user?.updatedAt) return null;
    return user.updatedAt.toDate();
  }
}
