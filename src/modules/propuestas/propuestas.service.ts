import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { EmailService } from '../../services/email.service';
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
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
        actividades: {
          where: { isActive: true, deletedAt: null },
        },
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
        actividades: {
          where: { isActive: true, deletedAt: null },
        },
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
        actividades: {
          where: { isActive: true, deletedAt: null },
        },
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

    // handle actividades and actividadesEliminadas
    if (dto.actividades || dto.actividadesEliminadas) {
      await this.prisma.$transaction(async (tx) => {
        // Delete specific activities if actividadesEliminadas is provided
        if (dto.actividadesEliminadas && dto.actividadesEliminadas.length > 0) {
          console.log('aqui andamos');
          await tx.actividad.updateMany({
            where: {
              id: { in: dto.actividadesEliminadas },
              propuestaId: id
            },
            data: { isActive: false, deletedAt: new Date() },
          });
        }

        // Handle actividades updates/creates
        if (dto.actividades) {
          const actividades = dto.actividades ?? [];

          for (const actividad of actividades) {
            if (actividad.id) {
              // Update existing activity
              const updateData: any = {};
              if (actividad.nombre) updateData.nombre = actividad.nombre;
              if (actividad.descripcion) updateData.descripcion = actividad.descripcion;
              if (actividad.fecha) updateData.fecha = new Date(actividad.fecha);
              if (actividad.horario !== undefined) updateData.horario = actividad.horario;

              await tx.actividad.update({
                where: { id: actividad.id },
                data: updateData,
              });
            } else {
              // Create new activity
              if (!actividad.fecha) {
                throw new HttpException(
                  'fecha es obligatoria para crear una actividad',
                  HttpStatus.BAD_REQUEST,
                );
              }
              if (!actividad.nombre || !actividad.descripcion) {
                throw new HttpException(
                  'nombre y descripcion son obligatorios para crear una actividad',
                  HttpStatus.BAD_REQUEST,
                );
              }

              await tx.actividad.create({
                data: {
                  nombre: actividad.nombre,
                  descripcion: actividad.descripcion,
                  fecha: new Date(actividad.fecha),
                  horario: actividad.horario ?? null,
                  creadorId: actual.creadorId,
                  propuestaId: id,
                },
              });
            }
          }
        }
      });
    }

    if (Object.keys(data).length === 0 && !dto.actividades && !dto.actividadesEliminadas) {
      return this.findOne(id);
    }

    const updated = await this.prisma.propuesta.update({
      where: { id },
      data,
      include: {
        categorias: true,
        creador: true,
        actividades: {
          where: { isActive: true, deletedAt: null },
        },
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
        actividades: {
          where: { isActive: true, deletedAt: null },
        },
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

    const asistencia = await this.prisma.asistente.create({
      data: {
        propuestaId,
        cuentaId,
        estado: dto.estado,
      },
      include: { 
        propuesta: {
          include: {
            comunidad: true,
            actividades: {
              where: { isActive: true, deletedAt: null },
            },
          },
        }, 
        cuenta: true 
      },
    });
    console.log(dto);
    // Enviar email de confirmación si el estado es ASISTIRE
    if (dto.estado === 'ASISTIRE' && asistencia.cuenta.correo) {
      const nombreCompleto = (asistencia.cuenta.nombre || '') + 
        (asistencia.cuenta.apellido ? ' ' + asistencia.cuenta.apellido : '');
      
      this.emailService.sendEventConfirmationEmail(
        asistencia.cuenta.correo,
        nombreCompleto || 'Usuario',
        asistencia.propuesta,
        asistencia.propuesta.actividades,
      ).catch(error => console.error('Error enviando email de confirmación:', error));
    }

    return asistencia;
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

    const updatedAsistencia = await this.prisma.asistente.update({
      where: { id: asistencia.id },
      data: { estado: dto.estado },
      include: { 
        propuesta: {
          include: {
            comunidad: true,
            actividades: {
              where: { isActive: true, deletedAt: null },
            },
          },
        }, 
        cuenta: true 
      },
    });

    // Enviar email de confirmación si el nuevo estado es ASISTIRE
    if (dto.estado === 'ASISTIRE' && updatedAsistencia.cuenta.correo) {
      const nombreCompleto = (updatedAsistencia.cuenta.nombre || '') + 
        (updatedAsistencia.cuenta.apellido ? ' ' + updatedAsistencia.cuenta.apellido : '');
      
      this.emailService.sendEventConfirmationEmail(
        updatedAsistencia.cuenta.correo,
        nombreCompleto || 'Usuario',
        updatedAsistencia.propuesta,
        updatedAsistencia.propuesta.actividades,
      ).catch(error => console.error('Error enviando email de confirmación:', error));
    }

    return updatedAsistencia;
  }

}
