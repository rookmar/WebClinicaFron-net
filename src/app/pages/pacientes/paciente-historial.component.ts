import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteService } from '../../core/services/paciente.service';
import {
  CatalogoMedico,
  CatalogoSucursal,
  Consulta,
  HistorialPaciente,
} from '../../core/models/paciente.model';

/**
 * Módulo Pacientes - ii. Historial de consultas y tratamientos vinculados al paciente.
 * Lectura desde GET /api/Pacientes/{id}/Historial (Consulta + Diagnostico +
 * Tratamiento + Evolucion + Examen + AsignacionHabitacion).
 */
@Component({
  selector: 'app-paciente-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paciente-historial.component.html',
  styleUrl: './paciente-historial.component.css',
})
export class PacienteHistorialComponent implements OnInit {
  private svc = inject(PacienteService);
  private route = inject(ActivatedRoute);

  readonly historial = signal<HistorialPaciente | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');

  /** Pestaña activa: resumen | consultas | tratamientos */
  tab: 'resumen' | 'consultas' | 'tratamientos' = 'resumen';

  /* --- Catálogos para registrar consulta/diagnóstico/tratamiento --- */
  medicos: CatalogoMedico[] = [];
  sucursales: CatalogoSucursal[] = [];

  /* --- Modal nueva consulta --- */
  modalConsulta = false;
  guardando = false;
  hoyIso = new Date().toISOString().slice(0, 10);
  formConsulta = this.consultaVacia();

  /* --- Modal diagnóstico / tratamiento (vinculados a una consulta) --- */
  modalClinico: 'diagnostico' | 'tratamiento' | null = null;
  consultaSel: Consulta | null = null;
  formDiagnostico = { descripcion: '' };
  formTratamiento = { descripcion: '', indicaciones: '', fechaInicio: this.hoyIso, fechaFin: '' };

  readonly totalRegistros = computed(() => {
    const h = this.historial();
    if (!h) return 0;
    return h.consultas.length + h.tratamientos.length + h.diagnosticos.length +
           h.evoluciones.length + h.examenes.length;
  });

  /** Tratamientos sin fecha de fin o con fecha de fin futura */
  readonly tratamientosVigentes = computed(
    () => (this.historial()?.tratamientos ?? []).filter(t => !t.fechaFin || t.fechaFin >= this.hoyIso).length,
  );

  iniciales(p: { nombres: string; apellidos: string }): string {
    return `${p.nombres[0] ?? ''}${p.apellidos[0] ?? ''}`.toUpperCase();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
    this.svc.catalogosMedicos().subscribe(m => (this.medicos = m));
    this.svc.catalogosSucursales().subscribe(s => (this.sucursales = s));
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.error.set('');
    this.svc.historial(id).subscribe({
      next: h => this.historial.set(h),
      error: () => this.error.set('No se pudo cargar el historial del paciente.'),
      complete: () => this.cargando.set(false),
    });
  }

  cambiarTab(t: typeof this.tab): void {
    this.tab = t;
  }

  /* ----------------------- Nueva consulta ----------------------- */

  abrirConsulta(): void {
    this.formConsulta = this.consultaVacia();
    this.aviso.set('');
    this.modalConsulta = true;
  }

  guardarConsulta(): void {
    const h = this.historial();
    const f = this.formConsulta;
    if (!h || !f.idMedico || !f.idSucursal || !f.fechaConsulta) {
      this.aviso.set('Médico, sucursal y fecha de la consulta son obligatorios.');
      return;
    }
    this.guardando = true;
    this.svc.registrarConsulta(h.paciente.idPaciente, {
      idMedico: Number(f.idMedico),
      idSucursal: Number(f.idSucursal),
      fechaConsulta: new Date(f.fechaConsulta).toISOString(),
      motivoConsulta: f.motivoConsulta,
      sintomas: f.sintomas,
      observaciones: f.observaciones,
    }).subscribe({
      next: c => {
        this.modalConsulta = false;
        this.aviso.set(`Consulta #${c.idConsulta} registrada. Ahora puede añadir su diagnóstico o tratamiento.`);
        this.cargar(h.paciente.idPaciente);
      },
      error: () => this.aviso.set('Error al registrar la consulta.'),
      complete: () => (this.guardando = false),
    });
  }

  /* ------------- Diagnóstico / Tratamiento por consulta ------------- */

  abrirDiagnostico(c: Consulta): void {
    this.consultaSel = c;
    this.formDiagnostico = { descripcion: '' };
    this.aviso.set('');
    this.modalClinico = 'diagnostico';
  }

  abrirTratamiento(c: Consulta): void {
    this.consultaSel = c;
    this.formTratamiento = { descripcion: '', indicaciones: '', fechaInicio: this.hoyIso, fechaFin: '' };
    this.aviso.set('');
    this.modalClinico = 'tratamiento';
  }

  cerrarModalClinico(): void {
    this.modalClinico = null;
    this.consultaSel = null;
  }

  guardarDiagnostico(): void {
    const h = this.historial();
    const c = this.consultaSel;
    if (!h || !c || !this.formDiagnostico.descripcion.trim()) {
      this.aviso.set('La descripción del diagnóstico es obligatoria (NOT NULL).');
      return;
    }
    this.guardando = true;
    this.svc.registrarDiagnostico(h.paciente.idPaciente, {
      idConsulta: c.idConsulta,
      idMedico: c.idMedico,
      descripcion: this.formDiagnostico.descripcion.trim(),
    }).subscribe({
      next: d => {
        this.cerrarModalClinico();
        this.aviso.set(`Diagnóstico #${d.idDiagnostico} registrado en la consulta #${c.idConsulta}.`);
        this.cargar(h.paciente.idPaciente);
      },
      error: () => this.aviso.set('Error al registrar el diagnóstico.'),
      complete: () => (this.guardando = false),
    });
  }

  guardarTratamiento(): void {
    const h = this.historial();
    const c = this.consultaSel;
    if (!h || !c || !this.formTratamiento.descripcion.trim()) {
      this.aviso.set('La descripción del tratamiento es obligatoria (NOT NULL).');
      return;
    }
    if (this.formTratamiento.fechaFin && this.formTratamiento.fechaFin < this.formTratamiento.fechaInicio) {
      this.aviso.set('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    this.guardando = true;
    this.svc.registrarTratamiento(h.paciente.idPaciente, {
      idConsulta: c.idConsulta,
      idMedico: c.idMedico,
      descripcion: this.formTratamiento.descripcion.trim(),
      indicaciones: this.formTratamiento.indicaciones.trim(),
      fechaInicio: this.formTratamiento.fechaInicio,
      fechaFin: this.formTratamiento.fechaFin,
    }).subscribe({
      next: t => {
        this.cerrarModalClinico();
        this.aviso.set(`Tratamiento #${t.idTratamiento} vinculado a la consulta #${c.idConsulta}.`);
        this.cargar(h.paciente.idPaciente);
      },
      error: () => this.aviso.set('Error al registrar el tratamiento.'),
      complete: () => (this.guardando = false),
    });
  }

  /* --------------------------- Helpers --------------------------- */

  diagnosticosDe(idConsulta: number) {
    return (this.historial()?.diagnosticos ?? []).filter(d => d.idConsulta === idConsulta);
  }

  tratamientosDe(idConsulta: number) {
    return (this.historial()?.tratamientos ?? []).filter(t => t.idConsulta === idConsulta);
  }

  examenesDe(idConsulta: number) {
    return (this.historial()?.examenes ?? []).filter(e => e.idConsulta === idConsulta);
  }

  evolucionesDe(idConsulta: number) {
    return (this.historial()?.evoluciones ?? []).filter(e => e.idConsulta === idConsulta);
  }

  vigentes() {
    return (this.historial()?.tratamientos ?? []).filter(t => !t.fechaFin || t.fechaFin >= this.hoyIso);
  }

  nombreUltimoMedico(): string {
    const c = this.historial()?.consultas[0];
    return c ? `${c.medicoNombre}${c.especialidad ? ' · ' + c.especialidad : ''}` : '—';
  }

  fmtFechaHora(d: string): string {
    if (!d) return '—';
    const f = new Date(d);
    return f.toLocaleDateString('es-GT') + ' ' +
           f.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  }

  fmtFecha(d: string | null): string {
    return d ? d.slice(0, 10) : '—';
  }

  estadoTratamiento(t: { fechaFin: string | null }): string {
    if (!t.fechaFin) return 'Vigente';
    return t.fechaFin >= this.hoyIso ? 'Vigente' : 'Finalizado';
  }

  private consultaVacia() {
    return {
      idMedico: '' as number | '',
      idSucursal: '' as number | '',
      fechaConsulta: new Date().toISOString().slice(0, 16),
      motivoConsulta: '',
      sintomas: '',
      observaciones: '',
    };
  }
}
