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
      width: '400px',
      data,
      disableClose: true,
      autoFocus: true,
    });

    return dialogRef.afterClosed();
  }

  confirmDelete(itemName: string, itemType: string = 'este elemento'): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar ${itemType} "${itemName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'warn'
    });
  }
}
