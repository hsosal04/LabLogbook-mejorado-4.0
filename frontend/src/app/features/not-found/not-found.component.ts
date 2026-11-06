import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="container" style="max-width:600px; margin-top:3rem;">
    <div class="card">
      <h2>Página no encontrada</h2>
      <p>La ruta solicitada no existe dentro de la aplicación.</p>
      <a routerLink="/"><button class="primary">Volver al inicio</button></a>
    </div>
  </div>
  `
})
export class NotFoundComponent {}
