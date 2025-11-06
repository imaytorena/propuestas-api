import { PartialType } from '@nestjs/swagger';
import { InputJsonValue } from '@prisma/client/runtime/edge';

export class CreateComunidadDto {
  // access
  cuentaId: number;
  creadorId: number;
  // info
  nombre: string;
  descripcion: string;
  coloniaId?: number;
  poligono?: InputJsonValue; // Json polygon similar to Colonia.coordenadas
  categoria?: string;
  minColaboradores?: number;
  maxRepresentantes?: number;
  // relaciones opcionales
  categoriaIds?: number[];
}

export class UpdateComunidadDto extends PartialType(CreateComunidadDto) {}

export class ListComunidadesQuery {
  limit?: number;
  page?: number; // número de página (1-based)
  coloniaId?: number;
  creadorId?: number;
  nombre?: string; // búsqueda por nombre (ILIKE)
}

// DTO para recomendaciones KNN por cercanía espacial
export class RecommendComunidadesDto {
  // GeoJSON válido: Point | Polygon | MultiPolygon
  geometry: any;
  // número de elementos a recomendar (1..100)
  k?: number;
  // filtros opcionales
  municipioId?: number;
  coloniaId?: number;
  creadorId?: number;
  categoria?: string;
}
