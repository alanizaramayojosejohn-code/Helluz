import { Component, computed, inject } from '@angular/core'
import { NgClass } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'

export type ConfirmDialogTone = 'danger' | 'warning' | 'info'

export interface ConfirmDialogData {
   title?: string
   message: string
   confirmText?: string
   cancelText?: string
   /** Visual tone of the dialog. Defaults to 'danger'. */
   tone?: ConfirmDialogTone
   /** Override the icon shown on the confirm button. */
   confirmIcon?: string
   /** @deprecated kept for legacy callers; use `tone` instead. */
   confirmColor?: 'primary' | 'warn' | 'accent'
}

@Component({
   selector: 'app-confirm-dialog',
   standalone: true,
   imports: [NgClass, MatDialogModule],
   template: `
      <div class="bg-bg-elevated font-body text-ink flex flex-col">
         <!-- Header -->
         <div class="flex flex-col gap-4 px-7 pt-7 pb-4">
            <div
               class="w-12 h-12 rounded-md flex items-center justify-center"
               [ngClass]="{
                  'bg-error/15': tone() === 'danger',
                  'bg-warning/20': tone() === 'warning',
                  'bg-bg-brand-soft': tone() === 'info',
               }"
            >
               <span
                  class="material-symbols-rounded !text-[24px] !w-[24px] !h-[24px] leading-none"
                  [ngClass]="{
                     'text-error': tone() === 'danger',
                     'text-warning': tone() === 'warning',
                     'text-text-brand': tone() === 'info',
                  }"
                  >{{ headerIcon() }}</span
               >
            </div>
            <h2
               class="font-display text-h3 font-extrabold tracking-[-0.02em] text-ink leading-[1.1] m-0"
            >
               {{ data.title || '¿Estás seguro?' }}
            </h2>
            <p class="text-body-sm text-muted leading-relaxed m-0">
               {{ data.message }}
            </p>
         </div>

         <!-- Footer -->
         <div class="flex items-stretch gap-3 px-7 pt-4 pb-6">
            <button
               type="button"
               (click)="onCancel()"
               class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-transparent border border-solid border-standard border-border-strong text-ink text-body-sm font-bold cursor-pointer transition-colors duration-fast hover:bg-bg-inset"
            >
               {{ data.cancelText || 'Cancelar' }}
            </button>
            <button
               type="button"
               (click)="onConfirm()"
               class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-body-sm font-extrabold cursor-pointer border-0 shadow-brand transition-opacity duration-fast hover:opacity-90"
               [ngClass]="{
                  'bg-error text-on-brand': tone() === 'danger',
                  'bg-warning text-ink': tone() === 'warning',
                  'bg-brand-500 text-on-brand': tone() === 'info',
               }"
            >
               <span
                  class="material-symbols-rounded !text-[16px] !w-[16px] !h-[16px] leading-none"
                  >{{ confirmIcon() }}</span
               >
               {{ data.confirmText || defaultConfirmText() }}
            </button>
         </div>
      </div>
   `,
})
export class ConfirmDialogComponent {
   readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA)
   private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>)

   readonly tone = computed<ConfirmDialogTone>(() => {
      if (this.data.tone) return this.data.tone
      if (this.data.confirmColor === 'primary' || this.data.confirmColor === 'accent') return 'info'
      return 'danger'
   })

   readonly headerIcon = computed(() => {
      switch (this.tone()) {
         case 'warning':
            return 'warning'
         case 'info':
            return 'help'
         case 'danger':
         default:
            return 'warning'
      }
   })

   readonly confirmIcon = computed(() => {
      if (this.data.confirmIcon) return this.data.confirmIcon
      return this.tone() === 'danger' ? 'delete' : 'check'
   })

   readonly defaultConfirmText = computed(() => (this.tone() === 'danger' ? 'Eliminar' : 'Confirmar'))

   onConfirm(): void {
      this.dialogRef.close(true)
   }

   onCancel(): void {
      this.dialogRef.close(false)
   }
}
