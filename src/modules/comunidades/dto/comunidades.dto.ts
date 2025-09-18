import { PartialType } from '@nestjs/swagger';

export class CreateComunidadDto {
  // access
  cuentaId: number;
  creadorId: number;
  // info
  nombre: string;
  descripcion: string;
  coloniaId?: number;
  minColaboradores?: number;
  maxRepresentantes?: number;
  // relaciones opcionales
  categoriaIds?: number[];
}

export class UpdateComunidadDto extends PartialType(CreateComunidadDto) {}

export class ListComunidadesQuery {
  limit?: number;
  coloniaId?: number;
  creadorId?: number;
}
