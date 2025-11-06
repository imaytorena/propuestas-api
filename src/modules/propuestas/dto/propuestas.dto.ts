import { IsEnum } from 'class-validator';
import { EstadoAsistencia } from '@prisma/client';

export class CreateActividadDto {
  nombre: string;
  descripcion: string;
  // fecha de la actividad (obligatoria)
  fecha: string; // ISO date
  // horario opcional (ej. "14:30" o rango)
  horario?: string;
}

export class UpdateActividadDto {
  id?: number;
  nombre?: string;
  descripcion?: string;
  fecha?: string;
  horario?: string;
}

export class CreatePropuestaDto {
  titulo: string;
  descripcion: string;
  creadorId: number;
  // comunidad requerida para relacionar la propuesta
  comunidadId: number;
  categoriaIds?: number[];
  actividades?: CreateActividadDto[];
}

export class UpdatePropuestaDto {
  titulo?: string;
  descripcion?: string;
  // Permitir cambiar comunidad de la propuesta si se requiere
  comunidadId?: number;
  categoriaIds?: number[];
  actividades?: UpdateActividadDto[];
}

export class ListAllPropuestasQuery {
  limit?: number;
  comunidadId?: number;
}

export class CreateAsistenteDto {
  @IsEnum(EstadoAsistencia)
  estado: EstadoAsistencia;
}

export class UpdateAsistenteDto {
  @IsEnum(EstadoAsistencia)
  estado: EstadoAsistencia;
}
