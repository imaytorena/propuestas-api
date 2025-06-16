import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

@Controller('colonias')
export class ColoniasController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getAll() {
    const ubicaciones = await this.prismaService.ubicacion.findMany({
      take: 10,
    });

    return {
      type: 'FeatureCollection',
      features: ubicaciones.map((ubicacion) => ({
        type: 'Feature',
        properties: {
          municipio: ubicacion.municipio,
          nombre: ubicacion.nombre,
        },
        geometry: {
          type: 'Polygon',
          coordinates: ubicacion.coordenadas as number[][][],
        },
      })),
    };
  }
}
