import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Comunidad, Prisma } from '@prisma/client';
import {
  CreateComunidadDto,
  ListComunidadesQuery,
  UpdateComunidadDto,
} from './dto/comunidades.dto';

@Injectable()
export class ComunidadesService {
  constructor(private prisma: PrismaService) {}

  async getAll(
    q: ListComunidadesQuery,
  ): Promise<{ id: number; nombre: string }[]> {
    const limit = Math.min(q.limit ?? 10, 100);

    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof q.coloniaId === 'number' ? { coloniaId: q.coloniaId } : {}),
      ...(typeof q.creadorId === 'number' ? { creadorId: q.creadorId } : {}),
    };

    return this.prisma.comunidad.findMany({
      where,
      take: limit,
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPaginated(q: ListComunidadesQuery): Promise<{
    data: { id: number; nombre: string }[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const limit = Math.min(q.limit ?? 10, 100);
    const pageParsed = Number(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
      (q as unknown as { page?: unknown }).page as unknown as number,
    );
    const page =
      !Number.isNaN(pageParsed) && pageParsed > 0 ? Math.floor(pageParsed) : 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ComunidadWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof q.coloniaId === 'number' ? { coloniaId: q.coloniaId } : {}),
      ...(typeof q.creadorId === 'number' ? { creadorId: q.creadorId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.comunidad.count({ where }),
      this.prisma.comunidad.findMany({
        where,
        take: limit,
        skip,
        select: { id: true, nombre: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / limit));
    return { data, meta: { total, page, limit, pageCount } };
  }

  async findOne(id: number): Promise<Comunidad> {
    const comunidad = await this.prisma.comunidad.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
    if (!comunidad) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }
    return comunidad;
  }

  async create(dto: CreateComunidadDto): Promise<Comunidad> {
    const { categoriaIds, ...rest } = dto;

    return this.prisma.comunidad.create({
      data: {
        ...rest,
        categorias: categoriaIds?.length
          ? { connect: categoriaIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateComunidadDto): Promise<Comunidad> {
    const actual = await this.prisma.comunidad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    const { categoriaIds, ...rest } = dto;

    const data: Prisma.ComunidadUpdateInput = { ...rest };
    if (Array.isArray(categoriaIds)) {
      data.categorias = {
        set: [],
        connect: categoriaIds.map((id) => ({ id })),
      };
    }

    if (Object.keys(data).length === 0) {
      return actual;
    }

    return this.prisma.comunidad.update({ where: { id }, data });
  }

  async remove(id: number): Promise<Comunidad> {
    const actual = await this.prisma.comunidad.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Comunidad no encontrada', HttpStatus.NOT_FOUND);
    }

    return this.prisma.comunidad.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
