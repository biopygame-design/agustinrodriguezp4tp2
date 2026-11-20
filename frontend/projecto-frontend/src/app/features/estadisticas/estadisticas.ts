
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { PublicacionesService } from '../../core/service/publicacionservice/publicacionservice';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas implements OnInit {

  private publicacionesService = inject(PublicacionesService);

  fechaInicio = '';
  fechaFin = '';

  cargando = false;
  error = '';

  totalComentarios = 0;

  // Publicaciones por usuario
  publicacionesPorUsuario: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Publicaciones',
      data: [],
      backgroundColor: '#3498db'
    }]
  };

  opcionesPublicaciones: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Publicaciones por usuario'
      }
    }
  };

  // Cantidad de comentarios
  comentariosTotales: ChartData<'doughnut'> = {
    labels: ['Comentarios'],
    datasets: [{
      data: [0],
      backgroundColor: ['#2ecc71']
    }]
  };

  opcionesComentarios: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'Cantidad de comentarios'
      }
    }
  };

  // Comentarios por publicación
  comentariosPorPublicacion: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Comentarios',
      data: [],
      backgroundColor: '#e67e22'
    }]
  };

  opcionesComentariosPublicacion: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Comentarios por publicación'
      }
    }
  };

  ngOnInit(): void {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);

    this.fechaFin = this.formatearFecha(hoy);
    this.fechaInicio = this.formatearFecha(haceUnMes);

    this.cargarEstadisticas();
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  cargarEstadisticas(): void {

    if (!this.fechaInicio || !this.fechaFin) {
      this.error = 'Seleccioná ambas fechas';
      return;
    }

    if (this.fechaInicio > this.fechaFin) {
      this.error = 'La fecha inicial no puede ser posterior a la fecha final';
      return;
    }

    this.cargando = true;
    this.error = '';

    let respuestas = 0;

    const finalizarCarga = () => {
      respuestas++;

      if (respuestas === 3) {
        this.cargando = false;
      }
    };

    this.publicacionesService
      .obtenerPublicacionesPorUsuario(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (datos: any[]) => {
          this.publicacionesPorUsuario = {
            labels: datos.map(item =>
              item.usuario?.nombre ||
              item.usuario?.email ||
              'Usuario'
            ),
            datasets: [{
              label: 'Publicaciones',
              data: datos.map(item => item.totalPublicaciones),
              backgroundColor: '#3498db'
            }]
          };
          finalizarCarga();
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudieron cargar las publicaciones por usuario';
          finalizarCarga();
        }
      });

    this.publicacionesService
      .obtenerCantidadComentarios(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (datos: any) => {
          this.totalComentarios = datos.totalComentarios || 0;

          this.comentariosTotales = {
            labels: ['Comentarios registrados'],
            datasets: [{
              data: [this.totalComentarios],
              backgroundColor: ['#2ecc71']
            }]
          };
          finalizarCarga();
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudo cargar la cantidad de comentarios';
          finalizarCarga();
        }
      });

    this.publicacionesService
      .obtenerComentariosPorPublicacion(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (datos: any[]) => {
          this.comentariosPorPublicacion = {
            labels: datos.map(item => item.titulo),
            datasets: [{
              label: 'Comentarios',
              data: datos.map(item => item.totalComentarios),
              backgroundColor: '#e67e22'
            }]
          };
          finalizarCarga();
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudieron cargar los comentarios por publicación';
          finalizarCarga();
        }
      });
  }
}
