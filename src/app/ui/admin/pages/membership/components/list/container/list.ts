// components/list/container/component.ts
import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Membership } from '../../../../../models/membership.model';
import { MembershipService } from '../../../../../services/membership/membership.service';

@Component({
  selector: 'x-membership-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AsyncPipe,
  ],
  templateUrl: './component.html',
})
export class MembershipList implements OnInit {
  private readonly membershipService = inject(MembershipService);
  private readonly destroyRef = inject(DestroyRef);

  readonly createMembership = output<void>();
  readonly editMembership = output<string>();
  readonly viewDetail = output<string>();

  memberships$!: Observable<Membership[]>;

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly displayedColumns = ['name', 'duration', 'sessions', 'cost', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.memberships$ = this.membershipService.getMemberships();

    this.memberships$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoading.set(false),
        error: () => {
          this.errorMessage.set('Error al cargar membresías');
          this.isLoading.set(false);
        },
      });
  }

  onCreateMembership(): void {
    this.createMembership.emit();
  }

  onEditMembership(membership: Membership): void {
    if (membership.id) {
      this.editMembership.emit(membership.id);
    }
  }

  onViewDetail(membership: Membership): void {
    if (membership.id) {
      this.viewDetail.emit(membership.id);
    }
  }

  async onToggleStatus(membership: Membership): Promise<void> {
    if (!membership.id) return;

    try {
      await this.membershipService.toggleStatus(membership.id, membership.status);
    } catch (error) {
      this.errorMessage.set('Error al cambiar el estado');
    }
  }

  getDaysLabel(days: number[]): string {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.map(d => dayNames[d]).join(', ');
  }
}
