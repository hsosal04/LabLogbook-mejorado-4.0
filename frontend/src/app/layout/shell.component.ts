import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  user = computed(() => this.auth.currentUser());
  links = [
    { path: '/app/dashboard', label: 'Dashboard' },
    { path: '/app/profile', label: 'Perfil' },
  ];

  constructor(public auth: AuthService) {}
}
