import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Idea, Prisma } from '@prisma/client';
import {
  CreateIdeaDto,
  ListAllEntities,
  UpdateIdeaDto,
  GeneratePropuestaFromIdeaDto,
} from './dto/ideas.dto';

@Injectable()
export class IdeasService {
  constructor(private prisma: PrismaService) {}

  async getAll(q: ListAllEntities): Promise<{
    data: Idea[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const limit = Math.min(q.limit ?? 100, 100);
    const pageParsed = Number(
      (q as unknown as { page?: unknown }).page as number,
    );
    const page =
      !Number.isNaN(pageParsed) && pageParsed > 0 ? Math.floor(pageParsed) : 1;
    const skip = (page - 1) * limit;

    let comunidadIdFilter: number | undefined;
    if (q.comunidadId !== undefined && q.comunidadId !== null) {
      const parsed = Number(
        (q as unknown as { comunidadId?: unknown }).comunidadId as any,
      );
      if (!Number.isNaN(parsed)) comunidadIdFilter = parsed;
    }

    const where: Prisma.IdeaWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof comunidadIdFilter !== 'undefined'
        ? { comunidadId: comunidadIdFilter }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        take: limit,
        skip,
        include: {
          comunidad: true,
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

  async findOne(id: number): Promise<Idea> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
    if (!idea) {
      throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
    }
    return idea;
  }

  async create(idea: CreateIdeaDto): Promise<Idea> {
    return this.prisma.idea.create({
      data: idea,
      include: {
        comunidad: true,
      },
    });
  }

  async update(id: number, nuevaIdea: UpdateIdeaDto): Promise<Idea> {
    const actual = await this.prisma.idea.findUnique({ where: { id } }) as Idea;
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
    }

    if (
      actual.titulo === nuevaIdea.titulo ||
      actual.descripcion === nuevaIdea.descripcion
    ) {
      throw new HttpException(
        'Los datos no pueden ser iguales a los actuales',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.idea.update({
      where: { id },
      include: {
        comunidad: true,
      },
      data: nuevaIdea,
    });

    // Registrar edición según modelo Prisma Edicion
    try {
      await this.prisma.edicion.create({
        data: {
          editedId: id,
          editedTable: 1, // 1=ideas (convención interna)
          key: 'descripcion',
          oldValue: actual.descripcion,
          // editedAt y editedBy se autogeneran por el schema (DateTime defaults)
        },
      });
    } catch {
      // no bloquear la actualización si la auditoría falla
    }

    return updated;
  }

  async generarPropuesta(id: number, dto: GeneratePropuestaFromIdeaDto) {
    const idea = await this.findOne(id);

    // Determinar nombre y descripcion a partir del descripcion si no se proveen
    const descripcionOld = idea.descripcion?.trim() ?? '';
    // nombre máximo 255 chars según Prisma (VarChar 255)
    const nombre = (dto.nombre ?? descripcionOld).slice(0, 255);
    const descripcion = dto.descripcion ?? descripcionOld;

    let comunidadIdForPropuesta: number | undefined;
    if (typeof dto.comunidadId === 'number') {
      comunidadIdForPropuesta = dto.comunidadId;
    } else if (typeof idea.comunidadId === 'number') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      comunidadIdForPropuesta = idea.comunidadId;
    } else {
      comunidadIdForPropuesta = undefined;
    }

    const propuesta = await this.prisma.propuesta.create({
      data: {
        titulo: nombre,
        descripcion,
        creadorId: dto.creadorId,
        comunidadId: comunidadIdForPropuesta,
        categorias: dto.categoriaIds?.length
          ? { connect: dto.categoriaIds.map((cid) => ({ id: cid })) }
          : undefined,
      },
      include: { categorias: true, creador: true },
    });

    await this.prisma.idea.delete({
      where: { id: idea.id },
    });
    return propuesta;
  }

  async remove(id: number): Promise<Idea> {
    const actual = await this.prisma.idea.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
    }
    return this.prisma.idea.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
