import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { Usuario, Prisma } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async getById(
    userWhereUniqueInput: Prisma.UsuarioWhereUniqueInput,
  ): Promise<any> {
    console.log(userWhereUniqueInput.id);
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
      },
    });

    const asistenciasAsistire = await this.prisma.asistente.findMany({
      where: { 
        cuentaId: userWhereUniqueInput.id,
        estado: 'ASISTIRE'
      },
      select: { propuestaId: true },
    });

    const asistenciasInteres = await this.prisma.asistente.findMany({
      where: { 
        cuentaId: userWhereUniqueInput.id,
        estado: 'ME_INTERESA'
      },
      select: { propuestaId: true },
    });

    const propuestaIdsAsistire = asistenciasAsistire.map(a => a.propuestaId);
    const propuestaIdsInteres = asistenciasInteres.map(a => a.propuestaId);


    const propuestasInteres = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsInteres },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { fechaActividad: 'asc' },
    });

    return { ...cuenta, propuestaIdsAsistire, propuestasInteres };
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
    return this.prisma.usuario.create({
      data,
    });
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
        estado: 'ASISTIRE'
      },
      select: { propuestaId: true },
    });

    const asistenciasInteres = await this.prisma.asistente.findMany({
      where: { 
        cuentaId: id,
        estado: 'ME_INTERESA'
      },
      select: { propuestaId: true },
    });

    const propuestaIdsAsistire = asistenciasAsistire.map(a => a.propuestaId);
    const propuestaIdsInteres = asistenciasInteres.map(a => a.propuestaId);

    const propuestasSuscritas = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsAsistire },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { fechaActividad: 'asc' },
    });

    const propuestasInteres = await this.prisma.propuesta.findMany({
      where: {
        id: { in: propuestaIdsInteres },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { fechaActividad: 'asc' },
    });

    return { ...cuenta, propuestasSuscritas, propuestasInteres };
  }

  async validateIdentificador(identificador: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.cuenta.findUnique({
      where: { identificador },
    });
    return { available: !existing };
  }
}
