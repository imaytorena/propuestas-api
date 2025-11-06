import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Actividad, Prisma } from '@prisma/client';
import {
  CreateActividadDto,
  UpdateActividadDto,
  ListAllEntities,
} from './actividades.controller';

@Injectable()
export class ActividadesService {
  constructor(private prisma: PrismaService) {}

  async getAll(q: ListAllEntities): Promise<{
    data: Actividad[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const limit = Math.min(q.limit ?? 100, 100);
    const page = Math.max(1, Math.floor(Number(q.page) || 1));
    const skip = (page - 1) * limit;

    const where: Prisma.ActividadWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(q.propuestaId ? { propuestaId: q.propuestaId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.actividad.count({ where }),
      this.prisma.actividad.findMany({
        where,
        take: limit,
        skip,
        include: {
          creador: true,
          propuesta: true,
          categorias: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      meta: { total, page, limit, pageCount },
    };
  }

  async findOne(id: number): Promise<Actividad> {
    const actividad = await this.prisma.actividad.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        creador: true,
        propuesta: true,
        categorias: true,
      },
    });
    if (!actividad) {
      throw new HttpException('Actividad no encontrada', HttpStatus.NOT_FOUND);
    }
    return actividad;
  }

  async create(actividad: CreateActividadDto): Promise<Actividad> {
    return this.prisma.actividad.create({
      data: actividad,
      include: {
        creador: true,
        propuesta: true,
        categorias: true,
      },
    });
  }

  async update(
    id: number,
    nuevaActividad: UpdateActividadDto,
  ): Promise<Actividad> {
    const actual = await this.prisma.actividad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Actividad no encontrada', HttpStatus.NOT_FOUND);
    }

    return this.prisma.actividad.update({
      where: { id },
      data: nuevaActividad,
      include: {
        creador: true,
        propuesta: true,
        categorias: true,
      },
    });
  }

  async remove(id: number): Promise<Actividad> {
    const actual = await this.prisma.actividad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Actividad no encontrada', HttpStatus.NOT_FOUND);
    }
    return this.prisma.actividad.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
