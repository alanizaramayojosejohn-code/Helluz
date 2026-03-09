import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'

// Firebase (AngularFire modular)
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app'
import { provideAuth, getAuth } from '@angular/fire/auth'
import { provideFirestore, getFirestore } from '@angular/fire/firestore'
import { provideStorage, getStorage } from '@angular/fire/storage'
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check'

import { routes } from './app.routes'
import { environment } from '../environments/environment'
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core'
import { MY_DATE_FORMATS } from './models/interfaces.config.model'

export const appConfig: ApplicationConfig = {
   providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes),
      provideAnimationsAsync(),

      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      provideStorage(() => getStorage()),

      provideNativeDateAdapter(),
      { provide: LOCALE_ID, useValue: 'es-ES' },
      { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
      { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
   ],
}
