import { PartialType } from '@nestjs/swagger';

export class CreateIdeaDto {
  titulo: string;
  descripcion: string;
  comunidadId: number;
}

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {}

export class ListAllEntities {
  limit?: number;
  page?: number; // número de página (1-based)
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
