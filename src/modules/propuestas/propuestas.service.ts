import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Propuesta, Prisma } from '@prisma/client';
import {
  CreatePropuestaDto,
  ListAllPropuestasQuery,
  UpdatePropuestaDto,
} from './dto/propuestas.dto';

@Injectable()
export class PropuestasService {
  constructor(private prisma: PrismaService) {}

  async getAll(q: ListAllPropuestasQuery): Promise<Propuesta[]> {
    const limit = Math.min(q.limit ?? 10, 100);
    return this.prisma.propuesta.findMany({
      where: { isActive: true, deletedAt: null },
      include: { categorias: true, creador: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Propuesta> {
    const propuesta = await this.prisma.propuesta.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: { categorias: true, creador: true },
    });
    if (!propuesta) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }
    return propuesta;
  }

  async create(dto: CreatePropuestaDto): Promise<Propuesta> {
    const { categoriaIds = [], ...data } = dto;
    return this.prisma.propuesta.create({
      data: {
        ...data,
        // connect optional categorias if provided
        categorias: categoriaIds.length
          ? { connect: categoriaIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { categorias: true, creador: true },
    });
  }

  async update(id: number, dto: UpdatePropuestaDto): Promise<Propuesta> {
    const actual = await this.prisma.propuesta.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.PropuestaUpdateInput = {};

    if (typeof dto.titulo !== 'undefined') data.titulo = dto.titulo;
    if (typeof dto.descripcion !== 'undefined')
      data.descripcion = dto.descripcion;
    // if (typeof dto.creadorId !== 'undefined') data.creadorId = dto.creadorId;

    // handle categorias replacement if provided
    if (typeof dto.categoriaIds !== 'undefined') {
      data.categorias = {
        set: [],
        ...(dto.categoriaIds.length
          ? { connect: dto.categoriaIds.map((cid) => ({ id: cid })) }
          : {}),
      } as Prisma.CategoriaUpdateManyWithoutPropuestasNestedInput;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    const updated = await this.prisma.propuesta.update({
      where: { id },
      data,
      include: { categorias: true, creador: true },
    });

    return updated;
  }

  async remove(id: number): Promise<Propuesta> {
    const actual = await this.prisma.propuesta.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }
    return this.prisma.propuesta.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      include: { categorias: true, creador: true },
    });
  }
}
