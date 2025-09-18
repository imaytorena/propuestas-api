import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

@Controller('colonias')
export class ColoniasController {
  constructor(private readonly prisma: PrismaService) {}

  // Returns paginated GeoJSON FeatureCollection of colonias with polygon coordinates
  @Get()
  async getAll(
    @Query('municipioId') municipioId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    // Enforce pagination by default; allow up to 1000 per page
    const takeNum = Math.min(Math.max(parseInt(limit ?? '', 10) || 200, 1), 1000);
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;

    const where: any = {
      coordenadas: { not: null },
    };
    if (municipioId) {
      const idNum = parseInt(municipioId, 10);
      if (!Number.isNaN(idNum)) {
        where.municipioId = idNum;
      }
    }

    // Fetch one extra record to determine if there is a next page
    const colonias = await this.prisma.colonia.findMany({
      where,
      include: {
        municipio: true,
      },
      orderBy: { id: 'asc' },
      take: takeNum + 1,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
    });

    const hasMore = colonias.length > takeNum;
    const items = hasMore ? colonias.slice(0, takeNum) : colonias;
    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    return {
      data: items
        .filter((c) => c.coordenadas)
        .map((colonia) => ({
          type: 'Feature',
          properties: {
            nombre: colonia.nombre,
            municipio: colonia.municipio?.nombre,
          },
          geometry: colonia.coordenadas,
        })),
      // Pagination metadata (allowed as foreign members in GeoJSON)
      nextCursor,
      hasMore,
      count: items.length,
    };
  }
}
