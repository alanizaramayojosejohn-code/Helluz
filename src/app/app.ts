import { Component, inject, OnDestroy } from '@angular/core';
import { NavigationError, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: 'app.html',
})
export class AppComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly navErrorSub: Subscription;

  constructor() {
    this.navErrorSub = this.router.events
      .pipe(filter((e): e is NavigationError => e instanceof NavigationError))
      .subscribe(event => {
        if (this.isChunkLoadError(event.error)) {
          window.location.assign(event.url);
        }
      });
  }

  ngOnDestroy(): void {
    this.navErrorSub.unsubscribe();
  }

  private isChunkLoadError(error: Error): boolean {
    const message = error?.message ?? '';
    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError')
    );
  }
}
