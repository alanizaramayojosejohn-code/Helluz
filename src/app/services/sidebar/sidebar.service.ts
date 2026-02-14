// services/sidebar/sidebar.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isOpen = signal(true);
  isMobile = signal(false);

  toggle(): void {
    this.isOpen.update(value => !value);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setMobile(isMobile: boolean): void {
    this.isMobile.set(isMobile);
    // En móvil, el sidebar empieza cerrado
    if (isMobile) {
      this.isOpen.set(false);
    } else {
      // En desktop, el sidebar empieza abierto
      this.isOpen.set(true);
    }
  }
}
