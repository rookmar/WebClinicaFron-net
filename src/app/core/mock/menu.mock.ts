import { MenuItem } from '../models/menu-item.model';

/**
 * Menú de desarrollo. Estructura idéntica a la que devolverá la API .NET.
 * Cuando el backend esté listo, desactiva `useMockMenu` en environment.ts.
 */
export const MOCK_MENU: MenuItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-speedometer2' },
  {
    label: 'Mantenimiento',
    icon: 'bi bi-tools',
    children: [
      { label: 'Pacientes', route: '/dashboard/pacientes', icon: 'bi bi-people' },
      { label: 'Medicamentos', route: '/dashboard/medicamentos', icon: 'bi bi-capsule' },
      { label: 'Usuarios', route: '/dashboard/usuarios', icon: 'bi bi-person-gear', roles: ['ADMIN'] },
    ],
  },
  { label: 'Citas', route: '/dashboard/citas', icon: 'bi bi-calendar-check' },
  { label: 'Reportes', route: '/dashboard/reportes', icon: 'bi bi-bar-chart', roles: ['ADMIN', 'MEDICO'] },
];

/** Usuario simulado para el modo demo (sin backend) */
export const MOCK_USER = {
  id: 1,
  username: 'demo',
  fullName: 'Usuario Demo',
  email: 'demo@clinica.com',
  roles: ['ADMIN'],
};
