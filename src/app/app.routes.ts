import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main/main-layout.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'menu-demo',
        loadComponent: () =>
          import('./pages/menu-dinamico/menu-dinamico.component')
            .then(m => m.MenuDinamicoComponent),
      },
      // ---------- Módulo Pacientes ----------
      {
        // i. Registro de datos generales (listado + alta/edición)
        path: 'pacientes',
        loadComponent: () =>
          import('./pages/pacientes/pacientes-list.component')
            .then(m => m.PacientesListComponent),
      },
      {
        // ii. Historial de consultas y tratamientos vinculados al paciente
        path: 'pacientes/:id/historial',
        loadComponent: () =>
          import('./pages/pacientes/paciente-historial.component')
            .then(m => m.PacienteHistorialComponent),
      },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
