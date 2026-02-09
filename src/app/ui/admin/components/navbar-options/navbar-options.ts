import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
@Component({
   selector: 'app-navbar-options',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
   templateUrl: './navbar-options.html',
   styleUrls: ['./navbar-options.css'],
})
export class NavbarOptionsComponent {
   menuItems = [
      { label: 'Inicio', icon: 'home', route: '/home' },
      { label: 'Asistencias', icon: 'person-cart', route: '/products' },
      { label: 'Perfil', icon: 'person', route: '/profile' },
      { label: 'Sucursales', icon: 'person', route: '/admin/sucursales' },
      { label: 'Horarios', icon: 'person', route: '/admin/horarios' },
      { label: 'Instructores', icon: 'person', route: '/admin/instructores' },
      { label: 'Membresías', icon: 'person', route: '/admin/membresias' },
   ]
}
