import { PartialType } from '@nestjs/swagger';

export class CreateIdeaDto {
  contenido: string;
  comunidadId?: number; // opcional: una idea puede o no pertenecer a una comunidad
}

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {}

export class ListAllEntities {
  limit?: number;
  comunidadId?: number; // filtro opcional por comunidad
}

// DTO para generar propuesta desde una idea
export class GeneratePropuestaFromIdeaDto {
  creadorId: number;
  nombre?: string;
  descripcion?: string;
  categoriaIds?: number[];
  comunidadId?: number; // opcional: forzar comunidad para la propuesta generada
}
