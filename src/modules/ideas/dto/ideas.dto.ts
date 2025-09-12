import { PartialType } from '@nestjs/swagger';

export class CreateIdeaDto {
  contenido: string;
}

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {}

export class ListAllEntities {
  limit?: number;
}

// DTO para generar propuesta desde una idea
export class GeneratePropuestaFromIdeaDto {
  creadorId: number;
  nombre?: string;
  descripcion?: string;
  categoriaIds?: number[];
}
