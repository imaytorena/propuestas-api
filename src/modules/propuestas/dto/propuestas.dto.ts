import { PartialType } from '@nestjs/swagger';

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
  categoriaIds?: number[];
  actividades?: CreateActividadDto[];
}

export class UpdatePropuestaDto {
  titulo?: string;
  descripcion?: string;
  categoriaIds?: number[];
  actividades?: UpdateActividadDto[];
}

export class ListAllPropuestasQuery {
  limit?: number;
}
