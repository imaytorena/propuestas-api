import { PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoAsistencia } from '@prisma/client';

export class CreateActividadDto {
  nombre: string;
  descripcion: string;
}

export class UpdateActividadDto {
  id?: number;
  nombre?: string;
  descripcion?: string;
}

export class CreatePropuestaDto {
  titulo: string;
  descripcion: string;
  creadorId: number;
  fechaActividad?: string;
  horaActividad?: string;
  categoriaIds?: number[];
  actividades?: CreateActividadDto[];
}

export class UpdatePropuestaDto {
  titulo?: string;
  descripcion?: string;
  fechaActividad?: string;
  horaActividad?: string;
  categoriaIds?: number[];
  actividades?: UpdateActividadDto[];
}

export class ListAllPropuestasQuery {
  limit?: number;
}

export class CreateAsistenteDto {
  @IsEnum(EstadoAsistencia)
  estado: EstadoAsistencia;
}

export class UpdateAsistenteDto {
  @IsEnum(EstadoAsistencia)
  estado: EstadoAsistencia;
}
