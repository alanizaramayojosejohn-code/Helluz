import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'x-home',
  imports: [MatIconModule],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent { }
