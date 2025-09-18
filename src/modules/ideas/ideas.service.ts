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

  async getAll(q: ListAllEntities): Promise<Idea[]> {
    const limit = Math.min(q.limit ?? 10, 100);
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
    return this.prisma.idea.findMany({
      where,
      take: limit,
      include: {
        comunidad: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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
    console.log(idea);
    return this.prisma.idea.create({
      data: idea,
      include: {
        comunidad: true,
      },
    });
  }

  async update(id: number, nuevaIdea: UpdateIdeaDto): Promise<Idea> {
    const actual = await this.prisma.idea.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
    }

    const data: { contenido?: string; comunidadId?: number } = {};
    if (typeof nuevaIdea.contenido !== 'undefined') {
      if (actual.contenido === nuevaIdea.contenido) {
        throw new HttpException(
          'El contenido no puede ser igual al actual',
          HttpStatus.BAD_REQUEST,
        );
      }
      data.contenido = nuevaIdea.contenido;
    }
    if (typeof nuevaIdea.comunidadId !== 'undefined') {
      if (actual.comunidadId !== nuevaIdea.comunidadId) {
        data.comunidadId = nuevaIdea.comunidadId;
      }
    }

    if (Object.keys(data).length === 0) {
      return actual; // nothing to update
    }

    const updated = await this.prisma.idea.update({
      where: { id },
      include: {
        comunidad: true,
      },
      data,
    });

    // Registrar edición según modelo Prisma Edicion
    try {
      await this.prisma.edicion.create({
        data: {
          editedId: id,
          editedTable: 1, // 1=ideas (convención interna)
          key: 'contenido',
          oldValue: actual.contenido,
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

    // Determinar nombre y descripcion a partir del contenido si no se proveen
    const contenido = idea.contenido?.trim() ?? '';
    // nombre máximo 255 chars según Prisma (VarChar 255)
    const nombre = (dto.nombre ?? contenido).slice(0, 255);
    const descripcion = dto.descripcion ?? contenido;

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
        nombre,
        descripcion,
        creadorId: dto.creadorId,
        comunidadId: comunidadIdForPropuesta,
        categorias: dto.categoriaIds?.length
          ? { connect: dto.categoriaIds.map((cid) => ({ id: cid })) }
          : undefined,
      },
      include: { categorias: true, creador: true },
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
