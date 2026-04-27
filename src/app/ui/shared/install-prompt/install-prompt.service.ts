import { DOCUMENT } from '@angular/common'
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { fromEvent } from 'rxjs'

interface BeforeInstallPromptEvent extends Event {
   readonly platforms: ReadonlyArray<string>
   readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
   prompt(): Promise<void>
}

const DISMISSED_KEY = 'helluz:install-prompt:dismissed-at'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
   private readonly document = inject(DOCUMENT)
   private readonly destroyRef = inject(DestroyRef)

   private readonly window = this.document.defaultView!
   private readonly storage = this.window.localStorage

   private readonly deferredEvent = signal<BeforeInstallPromptEvent | null>(null)
   private readonly installed = signal(this.isStandalone())
   private readonly dismissed = signal(this.isRecentlyDismissed())

   readonly isIos = this.detectIos()
   readonly canInstall = computed(() => this.deferredEvent() !== null)

   readonly shouldShow = computed(() => {
      if (this.installed()) return false
      if (this.dismissed()) return false
      return this.canInstall() || this.isIos
   })

   constructor() {
      fromEvent<BeforeInstallPromptEvent>(this.window, 'beforeinstallprompt')
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe(event => {
            event.preventDefault()
            this.deferredEvent.set(event)
         })

      fromEvent(this.window, 'appinstalled')
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe(() => {
            this.deferredEvent.set(null)
            this.installed.set(true)
         })
   }

   async promptInstall(): Promise<void> {
      const event = this.deferredEvent()
      if (!event) return
      await event.prompt()
      const choice = await event.userChoice
      this.deferredEvent.set(null)
      if (choice.outcome === 'dismissed') this.dismiss()
   }

   dismiss(): void {
      this.storage.setItem(DISMISSED_KEY, String(Date.now()))
      this.dismissed.set(true)
   }

   private isStandalone(): boolean {
      const matchMedia = this.window.matchMedia?.('(display-mode: standalone)').matches ?? false
      const iosStandalone = (this.window.navigator as { standalone?: boolean }).standalone === true
      return matchMedia || iosStandalone
   }

   private isRecentlyDismissed(): boolean {
      const raw = this.storage.getItem(DISMISSED_KEY)
      if (!raw) return false
      const at = Number(raw)
      if (!Number.isFinite(at)) return false
      return Date.now() - at < DISMISS_TTL_MS
   }

   private detectIos(): boolean {
      const ua = this.window.navigator.userAgent
      const isIosDevice = /iphone|ipad|ipod/i.test(ua)
      const isIpadOs = ua.includes('Mac') && 'ontouchend' in this.document
      const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
      return (isIosDevice || isIpadOs) && isSafari
   }
}
