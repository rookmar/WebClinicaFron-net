export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  /** URL del Hub SignalR (.NET 10): app.MapHub<HabitacionesHub>("/hubs/habitaciones") */
  hubUrl: 'http://localhost:5000/hubs/habitaciones',
  /**
   * MODO MOCK: mientras la API .NET no esté lista, simula login y menú.
   * Cuando tu compañero termine el backend, cambia esto a `false`.
   * No hay que tocar ningún componente: solo este flag.
   */
  useMockApi: true,
};
