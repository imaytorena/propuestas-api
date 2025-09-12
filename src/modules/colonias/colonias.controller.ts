import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

@Controller('colonias')
export class ColoniasController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getAll() {
    //   const direcciones = await this.prismaService.direccion.findMany({
    //     take: 5,
    //     include: {
    //       colonia: {
    //         municipio: true,
    //       },
    //     },
    //   });
    //
    //   return {
    //     type: 'FeatureCollection',
    //     features: direcciones.map((direccion) => ({
    //       type: 'Feature',
    //       properties: {
    //         municipio: direccion.colonia?.municipio?.nombre,
    //         nombre: direccion.colonia?.nombre,
    //       },
    //       geometry: {
    //         type: 'Polygon',
    //         coordinates: direccion.coordenadas as number[][][],
    //       },
    //     })),
    //   };
  }
}
