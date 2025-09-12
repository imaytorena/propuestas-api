import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Idea } from '@prisma/client';
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
    return this.prisma.idea.findMany({
      where: { isActive: true, deletedAt: null },
      take: limit,
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
    return this.prisma.idea.create({
      data: idea,
    });
  }

  async update(id: number, nuevaIdea: UpdateIdeaDto): Promise<Idea> {
    const actual = await this.prisma.idea.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Idea no encontrada', HttpStatus.NOT_FOUND);
    }

    const data: { contenido?: string } = {};
    if (typeof nuevaIdea.contenido !== 'undefined') {
      if (actual.contenido === nuevaIdea.contenido) {
        throw new HttpException(
          'El contenido no puede ser igual al actual',
          HttpStatus.BAD_REQUEST,
        );
      }
      data.contenido = nuevaIdea.contenido;
    }

    if (Object.keys(data).length === 0) {
      return actual; // nothing to update
    }

    const updated = await this.prisma.idea.update({ where: { id }, data });

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

    const propuesta = await this.prisma.propuesta.create({
      data: {
        nombre,
        descripcion,
        creadorId: dto.creadorId,
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
