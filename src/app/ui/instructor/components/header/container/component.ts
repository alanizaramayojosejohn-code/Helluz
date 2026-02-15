// components/header/component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../../../services/auth/auth.service';
import { SidebarService } from '../../../../../services/sidebar/sidebar.service';
import { AuthUser } from '../../../../../models/user.model';

@Component({
  selector: 'i-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './component.html',
  styleUrls: ['./component.css'],
})
export class InstructorHeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);

  user = signal<AuthUser | null>(null);

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user.set(user);
    });
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  getUserDisplayName(): string {
    const currentUser = this.user();
    if (currentUser?.name) {
      return `${currentUser.name} ${currentUser.lastname}`;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Usuario';
  }

  getUserEmail(): string {
    return this.user()?.email || 'Sin email';
  }

  getUserInitials(): string {
    const currentUser = this.user();
    if (currentUser?.name && currentUser?.lastname) {
      return `${currentUser.name[0]}${currentUser.lastname[0]}`.toUpperCase();
    }
    return 'U';
  }

  getUserRole(): string {
    const currentUser = this.user();
    return currentUser?.role === 'admin' ? 'Administrador' : 'Instructor';
  }
}
