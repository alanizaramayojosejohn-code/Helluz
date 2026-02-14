import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/nav-bar/nav-bar';

@Component({
  selector: 'x-component',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InstructorComponent {



}
