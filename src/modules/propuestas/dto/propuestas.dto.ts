import { PartialType } from '@nestjs/swagger';

export class CreatePropuestaDto {
  titulo: string;
  descripcion: string;
  creadorId: number;
  categoriaIds?: number[]; // optional: categorias to connect
}

export class UpdatePropuestaDto extends PartialType(CreatePropuestaDto) {}

export class ListAllPropuestasQuery {
  limit?: number;
}
