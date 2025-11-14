import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { EmailService } from '../../services/email.service';
import { Usuario, Prisma } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getById(
    userWhereUniqueInput: Prisma.UsuarioWhereUniqueInput,
  ): Promise<any> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id: userWhereUniqueInput.id },
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
        comunidadesMiembro: {
          include: { comunidad: true },
          where: { isActive: true, deletedAt: null },
        },
      },
    });

    const asistenciasAsistire = await this.prisma.asistente.findMany({
      where: {
        cuentaId: userWhereUniqueInput.id,
        estado: 'ASISTIRE',
      },
      select: { propuestaId: true },
    });

    const asistenciasInteres = await this.prisma.asistente.findMany({
      where: {
        cuentaId: userWhereUniqueInput.id,
        estado: 'ME_INTERESA',
      },
      select: { propuestaId: true },
    });

    const propuestaIdsAsistire = asistenciasAsistire.map((a) => a.propuestaId);
    const propuestaIdsInteres = asistenciasInteres.map((a) => a.propuestaId);

    const propuestasAsistire = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsAsistire },
        isActive: true,
        deletedAt: null,
      },
    });

    const propuestasInteres = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsInteres },
        isActive: true,
        deletedAt: null,
      },
    });

    const comunidades = (cuenta?.comunidadesMiembro || [])
      .map((m) => m.comunidad)
      .filter((c): c is NonNullable<typeof c> => !!c);

    return { ...cuenta, comunidades, propuestasAsistire, propuestasInteres };
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsuarioWhereUniqueInput;
    where?: Prisma.UsuarioWhereInput;
    orderBy?: Prisma.UsuarioOrderByWithRelationInput;
  }): Promise<Usuario[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.usuario.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    const usuario = await this.prisma.usuario.create({
      data,
      include: {
        cuenta: true,
      },
    });

    // Enviar email de bienvenida de forma asíncrona (no bloquear respuesta)
    if (usuario.cuenta?.correo) {
      this.emailService.sendWelcomeEmail(
        usuario.cuenta.correo,
        usuario.cuenta.nombre || undefined,
      ).catch(error => console.error('Error enviando email de bienvenida:', error));
    }

    return usuario;
  }

  async update(params: {
    where: Prisma.UsuarioWhereUniqueInput;
    data: Prisma.UsuarioUpdateInput;
  }): Promise<Usuario> {
    const { where, data } = params;
    return this.prisma.usuario.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.UsuarioWhereUniqueInput): Promise<Usuario> {
    return this.prisma.usuario.delete({
      where,
    });
  }

  async updateAccount(id: number, data: any): Promise<any> {
    const { usuario, nombre, apellido, ...cuentaData } = data;

    const updateData = {
      ...cuentaData,
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
    };

    // Update cuenta
    const updatedCuenta = await this.prisma.cuenta.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
        comunidadesMiembro: {
          include: { comunidad: true },
          where: { isActive: true, deletedAt: null },
        },
      },
    });

    // Update usuario if provided
    if (usuario && updatedCuenta.usuarioId) {
      await this.prisma.usuario.update({
        where: { id: updatedCuenta.usuarioId },
        data: usuario,
      });
    }

    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id },
      include: {
        usuario: {
          include: {
            direccion: true,
            carrera: true,
          },
        },
        comunidad: true,
      },
    });

    const asistenciasAsistire = await this.prisma.asistente.findMany({
      where: {
        cuentaId: id,
        estado: 'ASISTIRE',
      },
      select: { propuestaId: true },
    });

    const asistenciasInteres = await this.prisma.asistente.findMany({
      where: {
        cuentaId: id,
        estado: 'ME_INTERESA',
      },
      select: { propuestaId: true },
    });

    const propuestaIdsAsistire = asistenciasAsistire.map((a) => a.propuestaId);
    const propuestaIdsInteres = asistenciasInteres.map((a) => a.propuestaId);

    const propuestasSuscritas = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsAsistire },
        isActive: true,
        deletedAt: null,
      },
    });

    const propuestasInteres = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsInteres },
        isActive: true,
        deletedAt: null,
      },
    });

    return { ...cuenta, propuestasSuscritas, propuestasInteres };
  }

  async validateIdentificador(
    identificador: string,
  ): Promise<{ available: boolean }> {
    const existing = await this.prisma.cuenta.findUnique({
      where: { identificador },
    });
    return { available: !existing };
  }
}
