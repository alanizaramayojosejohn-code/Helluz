import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
@Component({
   selector: 'i-navbar-options',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
   templateUrl: './navbar-options.html',
   styleUrls: ['./navbar-options.css'],
})
export class NavbarOptionsComponent {
   menuItems = [
      { label: 'Inicio', icon: 'home', route: '/instructor/home' },
      { label: 'Alumnos', icon: 'person', route: '/instructor/alumnos' },
      { label: 'Inscripciones', icon: 'person', route: '/instructor/inscripciones' },
   ]
}
