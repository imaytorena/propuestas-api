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
      include: { categorias: true, creador: true, actividades: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Propuesta> {
    const propuesta = await this.prisma.propuesta.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: { categorias: true, creador: true, actividades: true },
    });
    if (!propuesta) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }
    return propuesta;
  }

  async create(dto: CreatePropuestaDto): Promise<Propuesta> {
    console.log('CreadorId recibido:', dto.creadorId);
    // Verificar que el creador existe
    const creador = await this.prisma.cuenta.findUnique({
      where: { id: dto.creadorId }
    });
    console.log('Creador encontrado:', creador);
    if (!creador) {
      throw new HttpException(`Creador no encontrado con ID: ${dto.creadorId}`, HttpStatus.BAD_REQUEST);
    }

    const { categoriaIds = [], actividades = [], ...data } = dto;
    console.log('Actividades recibidas:', actividades, 'Length:', actividades.length);
    return this.prisma.propuesta.create({
      data: {
        ...data,
        categorias: categoriaIds.length
          ? { connect: categoriaIds.map((id) => ({ id })) }
          : undefined,
        actividades: actividades && actividades.length > 0
          ? {
              create: actividades.map((actividad) => ({
                ...actividad,
                creadorId: dto.creadorId,
              })),
            }
          : undefined,
      },
      include: { categorias: true, creador: true, actividades: true },
    });
  }

  async update(id: number, dto: UpdatePropuestaDto): Promise<Propuesta> {
    console.log('DTO recibido:', dto);
    const actual = await this.prisma.propuesta.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.PropuestaUpdateInput = {};

    // Handle both title/titulo and description/descripcion for propuesta
    if (typeof dto.titulo !== 'undefined') {
      console.log('Actualizando titulo:', dto.titulo);
      data.titulo = dto.titulo;
    }
    if (typeof (dto as any).title !== 'undefined') {
      console.log('Actualizando title:', (dto as any).title);
      data.titulo = (dto as any).title;
    }
    if (typeof dto.descripcion !== 'undefined') {
      console.log('Actualizando descripcion:', dto.descripcion);
      data.descripcion = dto.descripcion;
    }
    if (typeof (dto as any).description !== 'undefined') {
      console.log('Actualizando description:', (dto as any).description);
      data.descripcion = (dto as any).description;
    }
    
    console.log('Data para actualizar propuesta:', data);

    // handle categorias replacement if provided
    if (typeof dto.categoriaIds !== 'undefined') {
      data.categorias = {
        set: [],
        ...(dto.categoriaIds.length
          ? { connect: dto.categoriaIds.map((cid) => ({ id: cid })) }
          : {}),
      } as Prisma.CategoriaUpdateManyWithoutPropuestasNestedInput;
    }

    // handle actividades update
    if (dto.actividades) {
      console.log('Procesando actividades:', dto.actividades);
      
      for (const actividad of dto.actividades) {
        console.log('Procesando actividad:', actividad);
        if (actividad.id) {
          console.log('Actualizando actividad con ID:', actividad.id);
          // Update existing actividad
          await this.prisma.actividad.update({
            where: { id: actividad.id },
            data: {
              nombre: actividad.nombre,
              descripcion: actividad.descripcion,
            },
          });
        } else {
          console.log('Creando nueva actividad');
          // Create new actividad
          await this.prisma.actividad.create({
            data: {
              nombre: actividad.nombre!,
              descripcion: actividad.descripcion!,
              creadorId: actual.creadorId,
              propuestaId: id,
            },
          });
        }
      }
      
      console.log('Actividades procesadas');
    }

    if (Object.keys(data).length === 0 && !dto.actividades) {
      console.log('No hay cambios, devolviendo propuesta actual');
      return this.findOne(id);
    }

    console.log('Actualizando propuesta con data:', data);
    const updated = await this.prisma.propuesta.update({
      where: { id },
      data,
      include: { categorias: true, creador: true, actividades: true },
    });
    console.log('Propuesta actualizada');

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
      include: { categorias: true, creador: true, actividades: true },
    });
  }
}
