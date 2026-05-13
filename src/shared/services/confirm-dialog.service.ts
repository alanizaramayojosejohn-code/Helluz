// shared/services/confirm-dialog.service.ts
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data,
      disableClose: true,
      autoFocus: true,
      panelClass: 'helluz-dialog-panel',
    });

    return dialogRef.afterClosed();
  }

  confirmDelete(itemName: string, itemType: string = 'este elemento'): Observable<boolean> {
    return this.confirm({
      title: `¿Eliminar ${itemType}?`,
      message: `Esta acción no se puede deshacer. Se eliminará "${itemName}" de manera permanente.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'warn'
    });
  }
}
