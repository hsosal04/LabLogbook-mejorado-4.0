import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="card" style="max-width: 520px; text-align: center;">
        <h1>Página no encontrada</h1>
        <p class="muted">La ruta solicitada no existe en este proyecto.</p>
        <a routerLink="/" class="btn-primary" style="display:inline-block;">Volver al inicio</a>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
