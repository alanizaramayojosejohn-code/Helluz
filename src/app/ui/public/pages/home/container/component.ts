import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'x-home',
  imports: [],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent { }
