import { DOCUMENT } from '@angular/common'
import { DestroyRef, Injectable, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { fromEvent, merge } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class OfflineService {
   private readonly document = inject(DOCUMENT)
   private readonly destroyRef = inject(DestroyRef)

   private readonly window = this.document.defaultView!

   readonly isOffline = signal(!this.window.navigator.onLine)

   constructor() {
      merge(fromEvent(this.window, 'online'), fromEvent(this.window, 'offline'))
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe(() => this.isOffline.set(!this.window.navigator.onLine))
   }
}
