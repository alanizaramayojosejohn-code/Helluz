// components/detail/container/component.ts
import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { Membership } from '../../../../../models/membership.model';
import { MembershipService } from '../../../../../services/membership/membership.service';

@Component({
  selector: 'x-membership-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './component.html',
})
export class MembershipDetail implements OnInit {
  private readonly membershipService = inject(MembershipService);
  private readonly destroyRef = inject(DestroyRef);

  readonly membershipId = input.required<string>();

  readonly edit = output<string>();
  readonly close = output<void>();

  readonly membership = signal<Membership | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly daysLabels: string[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  ngOnInit(): void {
    this.loadMembership();
  }

  private loadMembership(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.membershipService
      .getMembershipById(this.membershipId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (membership) => {
          if (membership) {
            this.membership.set(membership);
          } else {
            this.errorMessage.set('Membresía no encontrada');
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar la membresía');
          this.isLoading.set(false);
        },
      });
  }

  onEdit(): void {
    const id = this.membershipId();
    if (id) {
      this.edit.emit(id);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  async onToggleStatus(): Promise<void> {
    const membership = this.membership();
    if (!membership?.id) return;

    try {
      await this.membershipService.toggleStatus(membership.id, membership.status);
    } catch (error) {
      this.errorMessage.set('Error al cambiar el estado');
    }
  }

  async onDelete(): Promise<void> {
    const membership = this.membership();
    if (!membership?.id) return;

    const confirmed = confirm(`¿Estás seguro de eliminar la membresía "${membership.name}"?`);
    if (!confirmed) return;

    try {
      this.isLoading.set(true);
      await this.membershipService.deleteMembership(membership.id);
      this.close.emit();
    } catch (error) {
      this.errorMessage.set('Error al eliminar la membresía');
      this.isLoading.set(false);
    }
  }

  getDaysLabel(days: number[]): string {
    return days.map(d => this.daysLabels[d]).join(', ');
  }

  getCreatedAtDate(): Date | null {
    const membership = this.membership();
    if (!membership?.createdAt) return null;
    return membership.createdAt.toDate();
  }

  getUpdatedAtDate(): Date | null {
    const membership = this.membership();
    if (!membership?.updatedAt) return null;
    return membership.updatedAt.toDate();
  }
}
