import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Propuesta, Prisma } from '@prisma/client';
import {
  CreatePropuestaDto,
  ListAllPropuestasQuery,
  UpdatePropuestaDto,
  CreateAsistenteDto,
  UpdateAsistenteDto,
} from './dto/propuestas.dto';

@Injectable()
export class PropuestasService {
  constructor(private prisma: PrismaService) {}

  async getAll(q: ListAllPropuestasQuery): Promise<Propuesta[]> {
    const limit = Math.min(q.limit ?? 10, 100);

    // Parse comunidadId from query (can arrive as string or number)
    const raw = (q as unknown as { comunidadId?: unknown }).comunidadId;
    let comunidadId: number | undefined = undefined;
    if (typeof raw === 'string') {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) comunidadId = n;
    } else if (typeof raw === 'number' && !Number.isNaN(raw)) {
      comunidadId = Math.floor(raw);
    }

    const where: Prisma.PropuestaWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(typeof comunidadId === 'number' ? { comunidadId } : {}),
    };

    return this.prisma.propuesta.findMany({
      where,
      include: {
        categorias: true,
        creador: true,
        actividades: true,
        asistentes: { include: { cuenta: true } },
        comunidad: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, cuentaId?: number): Promise<any> {
    const propuesta = await this.prisma.propuesta.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        categorias: true,
        creador: true,
        actividades: true,
        asistentes: { include: { cuenta: true } },
        comunidad: true,
      },
    });
    if (!propuesta) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }

    let estatus: any = null;
    if (cuentaId) {
      const asistencia = await this.prisma.asistente.findFirst({
        where: { propuestaId: id, cuentaId },
      });
      estatus = asistencia?.estado || null;
    }

    return { ...propuesta, estatus };
  }

  async create(dto: CreatePropuestaDto): Promise<Propuesta> {
    // Verificar que el creador existe
    const creador = await this.prisma.cuenta.findUnique({
      where: { id: dto.creadorId },
    });
    if (!creador) {
      throw new HttpException(
        `Creador no encontrado con ID: ${dto.creadorId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // comunidadId es requerido
    if (typeof dto.comunidadId !== 'number' || Number.isNaN(dto.comunidadId)) {
      throw new HttpException(
        'comunidadId es requerido en la propuesta',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Validar que la comunidad exista y esté activa
    const comunidad = await this.prisma.comunidad.findFirst({
      where: { id: dto.comunidadId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!comunidad) {
      throw new HttpException('Comunidad no válida', HttpStatus.BAD_REQUEST);
    }

    const { categoriaIds = [], actividades = [], ...data } = dto;

    // Crear propuesta con actividades
    return this.prisma.propuesta.create({
      data: {
        ...data,
        categorias: categoriaIds.length
          ? { connect: categoriaIds.map((id) => ({ id })) }
          : undefined,
        actividades:
          actividades && actividades.length > 0
            ? {
                create: actividades.map((actividad) => ({
                  nombre: actividad.nombre,
                  descripcion: actividad.descripcion,
                  fecha: new Date(actividad.fecha),
                  horario: actividad.horario,
                  creadorId: dto.creadorId,
                })),
              }
            : undefined,
      },
      include: {
        categorias: true,
        creador: true,
        actividades: true,
        asistentes: { include: { cuenta: true } },
      },
    });
  }

  async update(id: number, dto: UpdatePropuestaDto): Promise<Propuesta> {
    const actual = await this.prisma.propuesta.findUnique({ where: { id } });
    if (!actual || !actual.isActive || actual.deletedAt) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.PropuestaUpdateInput = {};

    // Handle both title/titulo and description/descripcion for propuesta
    if (typeof dto.titulo !== 'undefined') {
      data.titulo = dto.titulo;
    }
    if (typeof (dto as any).title !== 'undefined') {
      data.titulo = (dto as any).title;
    }
    if (typeof dto.descripcion !== 'undefined') {
      data.descripcion = dto.descripcion;
    }
    if (typeof (dto as any).description !== 'undefined') {
      data.descripcion = (dto as any).description;
    }
    // comunidadId (opcional en update): validar si se envía
    if (typeof dto.comunidadId === 'number' && !Number.isNaN(dto.comunidadId)) {
      const comu = await this.prisma.comunidad.findFirst({
        where: { id: dto.comunidadId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!comu) {
        throw new HttpException('Comunidad no válida', HttpStatus.BAD_REQUEST);
      }
      data.comunidad = { connect: { id: dto.comunidadId } };
    }

    // handle categorias replacement if provided
    if (typeof dto.categoriaIds !== 'undefined') {
      data.categorias = {
        set: [],
        ...(dto.categoriaIds.length
          ? { connect: dto.categoriaIds.map((cid) => ({ id: cid })) }
          : {}),
      } as Prisma.CategoriaUpdateManyWithoutPropuestasNestedInput;
    }

    // handle actividades replace-all on update
    if (dto.actividades) {
      await this.prisma.$transaction(async (tx) => {
        // Soft-delete all existing actividades for this propuesta
        await tx.actividad.updateMany({
          where: { propuestaId: id, isActive: true, deletedAt: null },
          data: { isActive: false, deletedAt: new Date() },
        });

        const nuevas = dto.actividades ?? [];

        if (nuevas.length > 0) {
          // Validate payload and build batch
          const toCreate = nuevas.map((a, idx) => {
            if (!a.fecha) {
              throw new HttpException(
                `fecha es obligatoria para crear una actividad (index ${idx})`,
                HttpStatus.BAD_REQUEST,
              );
            }
            if (!a.nombre || !a.descripcion) {
              throw new HttpException(
                `nombre y descripcion son obligatorios para crear una actividad (index ${idx})`,
                HttpStatus.BAD_REQUEST,
              );
            }
            return {
              nombre: a.nombre,
              descripcion: a.descripcion,
              fecha: new Date(a.fecha),
              horario: a.horario ?? null,
              creadorId: actual.creadorId,
              propuestaId: id,
            };
          });

          // createMany
          await tx.actividad.createMany({
            data: toCreate,
          });
        }
      });

      console.log('Actividades reemplazadas');
    }

    if (Object.keys(data).length === 0 && !dto.actividades) {
      return this.findOne(id);
    }

    const updated = await this.prisma.propuesta.update({
      where: { id },
      data,
      include: {
        categorias: true,
        creador: true,
        actividades: true,
        asistentes: { include: { cuenta: true } },
      },
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
      include: {
        categorias: true,
        creador: true,
        actividades: true,
        asistentes: { include: { cuenta: true } },
      },
    });
  }

  async createAsistencia(
    propuestaId: number,
    cuentaId: number,
    dto: CreateAsistenteDto,
  ) {
    const propuesta = await this.prisma.propuesta.findFirst({
      where: { id: propuestaId, isActive: true, deletedAt: null },
    });
    if (!propuesta) {
      throw new HttpException('Propuesta no encontrada', HttpStatus.NOT_FOUND);
    }

    const existingAsistencia = await this.prisma.asistente.findFirst({
      where: { propuestaId, cuentaId },
    });
    if (existingAsistencia) {
      throw new HttpException(
        'Ya existe asistencia para esta propuesta',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.asistente.create({
      data: {
        propuestaId,
        cuentaId,
        estado: dto.estado,
      },
      include: { propuesta: true, cuenta: true },
    });
  }

  async updateAsistencia(
    propuestaId: number,
    cuentaId: number,
    dto: UpdateAsistenteDto,
  ) {
    const asistencia = await this.prisma.asistente.findFirst({
      where: { propuestaId, cuentaId },
    });
    if (!asistencia) {
      throw new HttpException('Asistencia no encontrada', HttpStatus.NOT_FOUND);
    }

    return this.prisma.asistente.update({
      where: { id: asistencia.id },
      data: { estado: dto.estado },
      include: { propuesta: true, cuenta: true },
    });
  }
}
