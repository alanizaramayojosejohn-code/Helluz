import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ data.title }}</h2>
      <p class="text-gray-700 mb-6">{{ data.message }}</p>
      <div class="flex gap-4 justify-end">
        <button
          (click)="onCancel()"
          class="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">
          Cancelar
        </button>
        <button
          (click)="onConfirm()"
          class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition">
          Eliminar
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
