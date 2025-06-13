import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes with parameters should use client-side rendering
  {
    path: 'reset-password/:token',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/leave/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/training/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/certificate/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/loan/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/advance/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/document/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'home/requests/:id',
    renderMode: RenderMode.Client
  },
  // All other routes can be prerendered
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
